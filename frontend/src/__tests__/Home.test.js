import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import Home from "../pages/Home";
import { MemoryRouter } from "react-router-dom";

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: jest.fn(),
  };
});

describe("Home", () => {
  beforeEach(() => {
    require("react-router-dom").useNavigate.mockReset();
  });

  it("renderiza correctamente los paneles de Login y Sign Up", () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    // Panel Login
    const loginPanel = screen.getByText(/accede a tu cuenta existente/i).closest(".login-side");
    expect(loginPanel).toBeInTheDocument();
    expect(within(loginPanel).getByRole("heading", { name: /login/i })).toBeInTheDocument();
    expect(within(loginPanel).getByText(/ir a login/i)).toBeInTheDocument();
    // Panel Sign Up
    const signupPanel = screen.getByText(/crea una cuenta nueva/i).closest(".signup-side");
    expect(signupPanel).toBeInTheDocument();
    expect(within(signupPanel).getByRole("heading", { name: /sign up/i })).toBeInTheDocument();
    expect(within(signupPanel).getByText(/ir a sign up/i)).toBeInTheDocument();
    // Logo
    expect(screen.getByAltText(/wodbuster ai/i)).toBeInTheDocument();
  });

  it("navega correctamente al hacer click en los botones", () => {
    const mockNavigate = jest.fn();
    require("react-router-dom").useNavigate.mockImplementation(() => mockNavigate);
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText(/ir a login/i));
    expect(mockNavigate).toHaveBeenCalledWith("/login");
    fireEvent.click(screen.getByText(/ir a sign up/i));
    expect(mockNavigate).toHaveBeenCalledWith("/signup");
  });
});
