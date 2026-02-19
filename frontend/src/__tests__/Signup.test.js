import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SignUp from "../components/Signup";
import { MemoryRouter } from "react-router-dom";

jest.mock("../api/api", () => ({
  signUpUser: jest.fn(),
  loginUser: jest.fn(),
}));

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: jest.fn(),
  };
});

describe("SignUp", () => {
  beforeEach(() => {
    require("react-router-dom").useNavigate.mockReset();
    require("../api/api").signUpUser.mockReset();
    require("../api/api").loginUser.mockReset();
  });

  it("renderiza correctamente el formulario de registro", () => {
    render(
      <MemoryRouter>
        <SignUp />
      </MemoryRouter>
    );
    expect(screen.getByRole("heading", { name: /crear cuenta/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/usuario/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /crear cuenta/i })).toBeInTheDocument();
    expect(screen.getByText(/¿ya tienes cuenta/i)).toBeInTheDocument();
    expect(screen.getByAltText(/wodbuster ai/i)).toBeInTheDocument();
  });

  it("muestra mensaje de error si el registro falla", async () => {
    require("../api/api").signUpUser.mockRejectedValue(new Error("Usuario ya existe"));
    render(
      <MemoryRouter>
        <SignUp />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "test@email.com", name: "email" } });
    fireEvent.change(screen.getByLabelText(/usuario/i), { target: { value: "testuser", name: "username" } });
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: "123456", name: "password" } });
    fireEvent.click(screen.getByRole("button", { name: /crear cuenta/i }));
    await waitFor(() => {
      expect(screen.getByText(/error: usuario ya existe/i)).toBeInTheDocument();
    });
  });

  it("registra y loguea correctamente, navega a dashboard", async () => {
    jest.useFakeTimers();
    const mockNavigate = jest.fn();
    require("react-router-dom").useNavigate.mockImplementation(() => mockNavigate);
    require("../api/api").signUpUser.mockResolvedValue({});
    require("../api/api").loginUser.mockResolvedValue({ token: "fake-token", user: { username: "testuser" } });
    render(
      <MemoryRouter>
        <SignUp />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "test@email.com", name: "email" } });
    fireEvent.change(screen.getByLabelText(/usuario/i), { target: { value: "testuser", name: "username" } });
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: "123456", name: "password" } });
    fireEvent.click(screen.getByRole("button", { name: /crear cuenta/i }));
    await waitFor(() => {
      expect(screen.getByText(/usuario registrado correctamente/i)).toBeInTheDocument();
    });
    jest.runAllTimers();
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });
    jest.useRealTimers();
  });

  it("navega a login al hacer click en el enlace", () => {
    const mockNavigate = jest.fn();
    require("react-router-dom").useNavigate.mockImplementation(() => mockNavigate);
    render(
      <MemoryRouter>
        <SignUp />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText(/inicia sesión aquí/i));
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });
});
