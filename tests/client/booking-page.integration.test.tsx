// @vitest-environment jsdom

import React, { act } from "react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import BookingPage from "../../client/src/pages/tours/booking";

const navigateMock = vi.fn();

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en" },
  }),
}));

vi.mock("wouter", () => ({
  useParams: () => ({ id: "7" }),
  useLocation: () => ["/book/7", navigateMock],
  Link: ({ children }: { children: React.ReactNode }) => React.createElement("div", null, children),
}));

vi.mock("../../client/src/hooks/use-tours", () => ({
  useTour: () => ({
    tour: {
      id: 7,
      name: { en: "Lisbon Highlights", pt: "Destaques de Lisboa", ru: "Лучшее в Лиссабоне" },
      shortDescription: { en: "Short", pt: "Curto", ru: "Коротко" },
      description: { en: "Desc", pt: "Desc", ru: "Desc" },
      imageUrl: "/tour.jpg",
      duration: 3,
      maxGroupSize: 8,
      difficulty: { en: "Easy", pt: "Facil", ru: "Легко" },
      price: 12500,
      priceType: "per_person",
      badge: { en: "Popular", pt: "Popular", ru: "Популярно" },
      badgeColor: "primary",
      isActive: true,
    },
    isLoading: false,
  }),
  useAvailabilities: () => ({
    availabilities: [
      {
        id: 12,
        tourId: 7,
        date: "2026-06-15",
        time: "09:00",
        maxSpots: 8,
        spotsLeft: 5,
      },
    ],
  }),
}));

vi.mock("../../client/src/components/booking/DateSelector", () => ({
  default: ({ onSelect }: { onSelect: (payload: any) => void }) =>
    React.createElement(
      "button",
      {
        type: "button",
        onClick: () =>
          onSelect({
            date: "2026-06-15",
            time: "09:00",
            availabilityId: 12,
          }),
      },
      "Mock date step",
    ),
}));

vi.mock("../../client/src/components/booking/ParticipantForm", () => ({
  default: ({
    onSelect,
    availableSpots,
    totalPrice,
  }: {
    onSelect: (payload: any, moveStep: boolean) => void;
    availableSpots: number;
    totalPrice: number;
  }) =>
    React.createElement(
      "div",
      null,
      React.createElement("div", null, `spots:${availableSpots}`),
      React.createElement("div", null, `total:${totalPrice}`),
      React.createElement(
        "button",
        {
          type: "button",
          onClick: () =>
            onSelect(
              {
                numberOfParticipants: 2,
                customerFirstName: "Luiz",
                customerLastName: "Cunha",
                customerEmail: "luiz@example.com",
                customerPhone: "+351123456789",
                specialRequests: "None",
              },
              true,
            ),
        },
        "Mock participant step",
      ),
    ),
}));

vi.mock("../../client/src/components/booking/PaymentForm", () => ({
  default: ({
    totalAmount,
    onPaymentComplete,
  }: {
    totalAmount: number;
    onPaymentComplete: (reference: string) => void;
  }) =>
    React.createElement(
      "div",
      null,
      React.createElement("div", null, `payment-total:${totalAmount}`),
      React.createElement(
        "button",
        {
          type: "button",
          onClick: () => onPaymentComplete("LT-REF12345"),
        },
        "Mock payment step",
      ),
    ),
}));

vi.mock("../../client/src/components/booking/RequestSent", () => ({
  default: ({ bookingReference }: { bookingReference: string }) =>
    React.createElement("div", null, `confirmation:${bookingReference}`),
}));

describe("client/pages/tours/booking integration", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    localStorage.clear();
    navigateMock.mockReset();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    document.body.innerHTML = "";
    localStorage.clear();
  });

  it("walks through the booking page flow and keeps the summary in sync", async () => {
    await act(async () => {
      root.render(<BookingPage />);
    });

    expect(container.textContent).toContain("Lisbon Highlights");
    expect(container.textContent).toContain("Mock date step");

    await act(async () => {
      const dateButton = Array.from(container.querySelectorAll("button")).find((button) =>
        button.textContent?.includes("Mock date step"),
      );
      dateButton?.click();
    });

    expect(container.textContent).toContain("spots:5");
    expect(container.textContent).toContain("total:12500");
    expect(container.textContent).toContain("2026");
    expect(container.textContent).toContain("09:00");

    await act(async () => {
      const participantButton = Array.from(container.querySelectorAll("button")).find((button) =>
        button.textContent?.includes("Mock participant step"),
      );
      participantButton?.click();
    });

    expect(container.textContent).toContain("payment-total:25000");
    expect(container.textContent).toContain("2 booking.people");

    await act(async () => {
      const paymentButton = Array.from(container.querySelectorAll("button")).find((button) =>
        button.textContent?.includes("Mock payment step"),
      );
      paymentButton?.click();
    });

    expect(container.textContent).toContain("confirmation:LT-REF12345");
    expect(localStorage.getItem("currentBookingReference")).toBe("LT-REF12345");
    expect(localStorage.getItem("currentBookingStep")).toBe("4");
  });
});
