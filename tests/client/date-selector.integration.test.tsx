// @vitest-environment jsdom

import React, { act } from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import DateSelector from "../../client/src/components/booking/DateSelector";
import type { Availability } from "../../shared/schema";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("../../client/src/components/ui/calendar", () => ({
  Calendar: () => React.createElement("div", { "data-testid": "calendar" }),
}));

const availabilities: Availability[] = [
  {
    id: 11,
    tourId: 7,
    date: "2026-06-15",
    time: "14:00",
    maxSpots: 8,
    spotsLeft: 3,
  },
  {
    id: 12,
    tourId: 7,
    date: "2026-06-15",
    time: "09:00",
    maxSpots: 8,
    spotsLeft: 5,
  },
  {
    id: 13,
    tourId: 7,
    date: "2026-06-15",
    time: "09:00",
    maxSpots: 8,
    spotsLeft: 2,
  },
];

describe("client/components/booking/DateSelector integration", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
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
    vi.useRealTimers();
  });

  it("renders sorted unique availability slots with the tour name fallback title", async () => {
    await act(async () => {
      root.render(
        <DateSelector
          availabilities={availabilities}
          selectedDate="2026-06-15"
          selectedTime=""
          selectedAvailabilityId={0}
          tourName="Lisbon by Night"
          onSelect={() => {}}
        />,
      );
    });

    const slotButtons = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button.time-slot"),
    );

    expect(slotButtons).toHaveLength(2);
    expect(slotButtons[0].textContent).toContain("9:00 AM");
    expect(slotButtons[1].textContent).toContain("2:00 PM");
    expect(slotButtons[0].getAttribute("title")).toBe("Lisbon by Night");
    expect(slotButtons[1].getAttribute("title")).toBe("Lisbon by Night");
  });

  it("shows the tour name tooltip when a slot receives hover/focus", async () => {
    vi.useFakeTimers();

    await act(async () => {
      root.render(
        <DateSelector
          availabilities={availabilities}
          selectedDate="2026-06-15"
          selectedTime=""
          selectedAvailabilityId={0}
          tourName="Lisbon by Night"
          onSelect={() => {}}
        />,
      );
    });

    const firstSlot = container.querySelector<HTMLButtonElement>("button.time-slot");
    expect(firstSlot).not.toBeNull();

    await act(async () => {
      firstSlot?.focus();
      vi.advanceTimersByTime(200);
    });

    const tooltip = document.body.querySelector('[role="tooltip"]');
    expect(tooltip?.textContent).toContain("Lisbon by Night");
  });

  it("submits the selected slot data when continuing to the next step", async () => {
    const onSelect = vi.fn();

    await act(async () => {
      root.render(
        <DateSelector
          availabilities={availabilities}
          selectedDate="2026-06-15"
          selectedTime=""
          selectedAvailabilityId={0}
          tourName="Lisbon by Night"
          onSelect={onSelect}
        />,
      );
    });

    const slotButtons = container.querySelectorAll<HTMLButtonElement>("button.time-slot");
    const nextButton = Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find(
      (button) => button.textContent?.includes("booking.nextStep"),
    );

    expect(slotButtons[0]).toBeDefined();
    expect(nextButton).toBeDefined();

    await act(async () => {
      slotButtons[0].click();
    });

    await act(async () => {
      nextButton?.click();
    });

    expect(onSelect).toHaveBeenCalledWith({
      date: "2026-06-15",
      time: "09:00",
      availabilityId: 12,
    });
  });
});
