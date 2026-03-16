// @vitest-environment jsdom

import React, { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AdminLoginPage from "../../client/src/pages/admin/login";
import { adminMeQueryKey } from "../../client/src/lib/admin-session";
import { apiRequest } from "../../client/src/lib/queryClient";

const navigateMock = vi.fn();

function setInputValue(input: HTMLInputElement, value: string) {
  const valueSetter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )?.set;

  valueSetter?.call(input, value);
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

vi.mock("wouter", async () => {
  const actual = await vi.importActual<typeof import("wouter")>("wouter");
  return {
    ...actual,
    useLocation: () => ["/admin/login", navigateMock] as const,
  };
});

vi.mock("react-helmet", () => ({
  Helmet: () => null,
}));

vi.mock("../../client/src/lib/queryClient", async () => {
  const actual = await vi.importActual<typeof import("../../client/src/lib/queryClient")>(
    "../../client/src/lib/queryClient",
  );

  return {
    ...actual,
    apiRequest: vi.fn(),
  };
});

describe("client/pages/admin/login integration", () => {
  let container: HTMLDivElement;
  let root: Root;
  let queryClient: QueryClient;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    navigateMock.mockReset();
    vi.mocked(apiRequest).mockReset();

    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
        mutations: {
          retry: false,
        },
      },
    });

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    queryClient.clear();
    container.remove();
    document.body.innerHTML = "";
  });

  it("replaces a cached unauthenticated admin session after a successful login", async () => {
    const user = {
      id: 1,
      username: "admin",
      isAdmin: true,
    };

    queryClient.setQueryData(adminMeQueryKey, null);
    vi.mocked(apiRequest).mockResolvedValue(
      new Response(JSON.stringify({ message: "Login successful", user }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <AdminLoginPage />
        </QueryClientProvider>,
      );
    });

    const usernameInput = container.querySelector<HTMLInputElement>("#username");
    const passwordInput = container.querySelector<HTMLInputElement>("#password");
    const form = container.querySelector("form");

    expect(usernameInput).not.toBeNull();
    expect(passwordInput).not.toBeNull();
    expect(form).not.toBeNull();

    await act(async () => {
      setInputValue(usernameInput!, "admin");
      setInputValue(passwordInput!, "adminpassword");
    });

    await act(async () => {
      form!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    expect(apiRequest).toHaveBeenCalledWith("POST", "/api/admin/login", {
      username: "admin",
      password: "adminpassword",
    });
    expect(queryClient.getQueryData(adminMeQueryKey)).toEqual(user);
    expect(navigateMock).toHaveBeenCalledWith("/admin");
  });
});
