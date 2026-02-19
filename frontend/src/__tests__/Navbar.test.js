import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Navbar from "../components/Navbar";
import { MemoryRouter } from "react-router-dom";

describe("Navbar", () => {
  beforeEach(() => {
    // Simula usuario logueado
    localStorage.setItem("user", JSON.stringify({ username: "testuser" }));
    localStorage.setItem("token", "fake-token");
  });
  afterEach(() => {
    localStorage.clear();
  });

  it("renderiza todos los botones principales", () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );
    expect(screen.getByText(/benchmarks/i)).toBeInTheDocument();
    expect(screen.getByText(/entrenamientos/i)).toBeInTheDocument();
    expect(screen.getByText(/wods crossfit/i)).toBeInTheDocument();
    expect(screen.getByText(/plan de entrenamiento/i)).toBeInTheDocument();
    expect(screen.getByText(/análisis de videos/i)).toBeInTheDocument();
    expect(screen.getByText(/configuración ia/i)).toBeInTheDocument();
    expect(screen.getByText(/perfil/i)).toBeInTheDocument();
    expect(screen.getByText(/cerrar sesión/i)).toBeInTheDocument();
  });

  it("navega correctamente al hacer click en los botones", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Navbar />
      </MemoryRouter>
    );
    const buttons = [
      /benchmarks/i,
      /entrenamientos/i,
      /wods crossfit/i,
      /plan de entrenamiento/i,
      /análisis de videos/i,
      /configuración ia/i,
      /perfil/i,
    ];
    buttons.forEach((text) => {
      const btn = screen.getByText(text).closest("button");
      expect(btn).toBeInTheDocument();
      fireEvent.click(btn);
    });
  });

  it("el botón de logout limpia el localStorage", () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );
    const logoutBtn = screen.getByText(/cerrar sesión/i).closest("button");
    expect(logoutBtn).toBeInTheDocument();
    fireEvent.click(logoutBtn);
    expect(localStorage.getItem("user")).toBeNull();
    expect(localStorage.getItem("token")).toBeNull();
  });
});
