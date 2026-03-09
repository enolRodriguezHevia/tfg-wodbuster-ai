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
    const { container } = render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );
    // Buscar solo en el menú desktop
    const desktopMenu = container.querySelector('.desktop-menu');
    expect(desktopMenu).toBeInTheDocument();
    expect(desktopMenu.textContent).toMatch(/perfil/i);
    expect(desktopMenu.textContent).toMatch(/benchmarks/i);
    expect(desktopMenu.textContent).toMatch(/entrenamientos/i);
    expect(desktopMenu.textContent).toMatch(/wods crossfit/i);
    expect(desktopMenu.textContent).toMatch(/plan de entrenamiento/i);
    expect(desktopMenu.textContent).toMatch(/análisis de videos/i);
    expect(desktopMenu.textContent).toMatch(/configuración ia/i);
    expect(desktopMenu.textContent).toMatch(/cerrar sesión/i);
  });

  it("navega correctamente al hacer click en los botones", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Navbar />
      </MemoryRouter>
    );
    // Buscar solo en el menú desktop
    const desktopMenu = container.querySelector('.desktop-menu');
    const buttons = [
      /perfil/i,
      /benchmarks/i,
      /entrenamientos/i,
      /wods crossfit/i,
      /plan de entrenamiento/i,
      /análisis de videos/i,
      /configuración ia/i,
    ];
    buttons.forEach((text) => {
      const allButtons = Array.from(desktopMenu.querySelectorAll('button'));
      const btn = allButtons.find(b => text.test(b.textContent));
      expect(btn).toBeInTheDocument();
      fireEvent.click(btn);
    });
  });

  it("el botón de logout limpia el localStorage", () => {
    const { container } = render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );
    // Buscar solo en el menú desktop
    const desktopMenu = container.querySelector('.desktop-menu');
    const logoutBtn = Array.from(desktopMenu.querySelectorAll('button')).find(
      btn => /cerrar sesión/i.test(btn.textContent)
    );
    expect(logoutBtn).toBeInTheDocument();
    fireEvent.click(logoutBtn);
    expect(localStorage.getItem("user")).toBeNull();
    expect(localStorage.getItem("token")).toBeNull();
  });
});
