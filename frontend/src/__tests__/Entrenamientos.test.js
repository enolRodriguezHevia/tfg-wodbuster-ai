import React from "react";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import Entrenamientos from "../pages/Entrenamientos";
import { BrowserRouter } from "react-router-dom";

jest.mock("../api/api", () => ({
  getEntrenamientos: jest.fn(() => Promise.resolve({ entrenamientos: [] })),
  registerEntrenamiento: jest.fn(() => Promise.resolve()),
  deleteEntrenamiento: jest.fn(() => Promise.resolve()),
}));

describe("Entrenamientos (componente)", () => {
  beforeEach(() => {
    localStorage.setItem("user", JSON.stringify({ username: "testuser" }));
  });

  it("renderiza la lista y permite abrir el formulario", async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <Entrenamientos />
        </BrowserRouter>
      );
    });
    // Usar el título principal para evitar ambigüedad
    expect(await screen.findByRole("heading", { name: /mis entrenamientos/i })).toBeInTheDocument();
    // Botón con texto exacto
    fireEvent.click(screen.getByText("+ Nuevo Entrenamiento"));
    // Comprobar que aparece el formulario
    expect(await screen.findByRole("heading", { name: /registrar nuevo entrenamiento/i })).toBeInTheDocument();
  });

  it("muestra error si se intenta registrar sin completar campos", async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <Entrenamientos />
        </BrowserRouter>
      );
    });
    fireEvent.click(screen.getByText("+ Nuevo Entrenamiento"));
    // Buscar el formulario por className
    const form = document.querySelector("form.entrenamiento-form");
    fireEvent.submit(form);
    expect(await screen.findByText(/el nombre es obligatorio/i)).toBeInTheDocument();
  });
});
