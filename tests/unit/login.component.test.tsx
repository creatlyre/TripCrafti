import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Login from "../../src/components/auth/Login";

const signOutMock = vi.fn();
const onAuthStateChangeMock = vi.fn((event?: any, session?: any) => ({
  data: { listener: { subscription: { unsubscribe: vi.fn() } } },
}));

const useUserMock = vi.fn();
vi.mock("@supabase/auth-helpers-react", () => ({
  useUser: () => useUserMock(),
  useSupabaseClient: () => ({
    auth: {
      signOut: signOutMock,
      onAuthStateChange: (event: any, session: any) => {
        onAuthStateChangeMock(event, session);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      },
    },
  }),
}));

vi.mock("@supabase/auth-ui-react", () => ({
  Auth: (props: any) => <div data-testid="auth-component">Auth Providers: {props.providers?.join(",")}</div>,
}));
vi.mock("@supabase/auth-ui-shared", () => ({ ThemeSupa: {} }));

describe("Login component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Auth UI when no user", () => {
    useUserMock.mockReturnValue(null);
    render(<Login />);
    expect(screen.getByTestId("auth-component")).toBeInTheDocument();
    expect(screen.getByText(/Auth Providers: google,github/i)).toBeVisible();
  });

  it("renders user info and sign out button when user present", () => {
    useUserMock.mockReturnValue({ email: "user@example.com" });
    render(<Login />);
    expect(screen.getByText("Signed in as")).toBeVisible();
    expect(screen.getByText("user@example.com")).toBeVisible();
    const button = screen.getByRole("button", { name: /sign out/i });
    fireEvent.click(button);
    expect(signOutMock).toHaveBeenCalled();
  });
});
