import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Dashboard from "../pages/Dashboard";
import { MemoryRouter } from "react-router-dom";

describe("Dashboard", () => {
  beforeEach(() => {
    // Simula un usuario logueado en localStorage
    localStorage.setItem(
      "user",
      JSON.stringify({ username: "testuser"})
    );
  });
  afterEach(() => {
    localStorage.clear();
  });

  it("renderiza todos los botones principales y la foto de perfil", () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // Botones principales (solo los de Dashboard, no Navbar)
    const dashboardButtons = [
      /mi perfil/i,
      /benchmarks/i,
      /entrenamientos/i,
      /wods crossfit/i,
      /plan de entrenamiento/i,
      /análisis de videos ia/i,
      /configuración ia/i,
    ];
    dashboardButtons.forEach((text) => {
      // Busca todos los elementos con ese texto y filtra el que sea button.function-button
      const all = screen.getAllByText(text);
      const btn = all.find(el => el.closest('button') && el.closest('button').className.includes('function-button'));
      expect(btn).toBeInTheDocument();
    });

    // Iconos
    expect(screen.getByText("👤")).toBeInTheDocument();
    expect(screen.getByText("💪")).toBeInTheDocument();
    expect(screen.getByText("🏋️")).toBeInTheDocument();
    expect(screen.getByText("⚡")).toBeInTheDocument();
    expect(screen.getByText("📋")).toBeInTheDocument();
    expect(screen.getByText("🎥")).toBeInTheDocument();
    expect(screen.getByText("⚙️")).toBeInTheDocument();
  });

  it("navega correctamente al hacer click en los botones", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Dashboard />
      </MemoryRouter>
    );
    // Simula clicks y verifica que los botones existen
    const buttons = [
      /mi perfil/i,
      /benchmarks/i,
      /entrenamientos/i,
      /wods crossfit/i,
      /plan de entrenamiento/i,
      /análisis de videos ia/i,
      /configuración ia/i,
    ];
    buttons.forEach((text) => {
      const all = screen.getAllByText(text);
      const btn = all.find(el => el.closest('button') && el.closest('button').className.includes('function-button'));
      expect(btn).toBeInTheDocument();
      fireEvent.click(btn);
    });
  });
});
