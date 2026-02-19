import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import WodsCrossFit from "../pages/WodsCrossFit";
import { BrowserRouter } from "react-router-dom";

jest.mock("../api/api", () => ({
  getWodsCrossFit: jest.fn(() => Promise.resolve({ wods: [] })),
  registerWodCrossFit: jest.fn(() => Promise.resolve()),
  deleteWodCrossFit: jest.fn(() => Promise.resolve()),
}));

describe("WodsCrossFit (componente)", () => {
  beforeEach(() => {
    localStorage.setItem("user", JSON.stringify({ username: "testuser" }));
  });

  it("renderiza la lista y permite abrir el formulario", async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <WodsCrossFit />
        </BrowserRouter>
      );
    });
    // Usar el título principal para evitar ambigüedad
    expect(await screen.findByRole("heading", { name: /wods de crossfit/i })).toBeInTheDocument();
    // Botón con texto exacto
    fireEvent.click(screen.getByText("+ Registrar WOD"));
    // Comprobar que aparece el formulario
    expect(await screen.findByText(/selecciona un wod/i)).toBeInTheDocument();
  });

  it("muestra error si se intenta registrar sin seleccionar wod", async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <WodsCrossFit />
        </BrowserRouter>
      );
    });
    fireEvent.click(screen.getByText("+ Registrar WOD"));
    // Buscar el formulario por className
    const form = document.querySelector("form.wod-form");
    fireEvent.submit(form);
    expect(await screen.findByText(/debes seleccionar un wod/i)).toBeInTheDocument();
  });
});
