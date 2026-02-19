import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Login from "../components/Login";
import { MemoryRouter } from "react-router-dom";

jest.mock("../api/api", () => ({
  loginUser: jest.fn(),
}));

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: jest.fn(),
  };
});

describe("Login", () => {
  beforeEach(() => {
    require("react-router-dom").useNavigate.mockReset();
    require("../api/api").loginUser.mockReset();
  });

  it("renderiza correctamente el formulario de login", () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    expect(screen.getByRole("heading", { name: /bienvenido de nuevo/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/usuario/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /iniciar sesión/i })).toBeInTheDocument();
    expect(screen.getByText(/¿no tienes cuenta/i)).toBeInTheDocument();
    expect(screen.getByAltText(/wodbuster ai/i)).toBeInTheDocument();
  });

  it("muestra mensaje de error si el login falla", async () => {
    require("../api/api").loginUser.mockRejectedValue(new Error("Credenciales incorrectas"));
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByLabelText(/usuario/i), { target: { value: "testuser", name: "username" } });
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: "wrongpass", name: "password" } });
    fireEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));
    await waitFor(() => {
      expect(screen.getByText(/usuario o contraseña incorrectos/i)).toBeInTheDocument();
    });
  });

  it("hace login correctamente y navega al dashboard", async () => {
    jest.useFakeTimers();
    const mockNavigate = jest.fn();
    require("react-router-dom").useNavigate.mockImplementation(() => mockNavigate);
    require("../api/api").loginUser.mockResolvedValue({ token: "fake-token", user: { username: "testuser" } });
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByLabelText(/usuario/i), { target: { value: "testuser", name: "username" } });
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: "123456", name: "password" } });
    fireEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));
    // Espera a que aparezca el mensaje de éxito
    await waitFor(() => {
      expect(screen.getByText(/¡login exitoso/i)).toBeInTheDocument();
    });
    // Avanza el timer para simular el setTimeout
    jest.runAllTimers();
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });
    jest.useRealTimers();
  });

  it("navega a signup al hacer click en el enlace", () => {
    const mockNavigate = jest.fn();
    require("react-router-dom").useNavigate.mockImplementation(() => mockNavigate);
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText(/regístrate aquí/i));
    expect(mockNavigate).toHaveBeenCalledWith("/signup");
  });
});
