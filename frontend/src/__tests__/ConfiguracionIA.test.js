import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ConfiguracionIA from "../pages/ConfiguracionIA";
import { BrowserRouter } from "react-router-dom";
import * as api from "../api/api";

jest.mock("../api/api");

jest.mock("../utils/auth", () => ({
  getLoggedUser: () => ({ username: "testuser" })
}));

describe("ConfiguracionIA (componente)", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renderiza la configuración y permite cambiar de modelo", async () => {

    api.obtenerConfiguracionLLM.mockResolvedValue({
      llmActual: "openai",
      modelosInfo: {
        claude: {
          nombre: "Claude Sonnet 4.5",
          proveedor: "Anthropic",
          velocidad: "Media",
          precision: "Muy Alta",
          detalle: "Excelente",
          especialidad: "Análisis biomecánico profundo",
          ventajas: ["Detalle"],
          desventajas: ["Más lento"]
        },
        openai: {
          nombre: "GPT-4o",
          proveedor: "OpenAI",
          velocidad: "Rápida",
          precision: "Alta",
          detalle: "Bueno",
          especialidad: "Respuestas rápidas",
          ventajas: ["Rápido"],
          desventajas: ["Menos detalle"]
        }
      }
    });

    api.actualizarPreferenciaLLM.mockResolvedValue({
      message: "Modelo actualizado correctamente"
    });

    render(
      <BrowserRouter>
        <ConfiguracionIA />
      </BrowserRouter>
    );

    // Esperar a que cargue el título
    expect(
      await screen.findByText(/configuración de inteligencia artificial/i)
    ).toBeInTheDocument();

    // Verificar modelos
    expect(
      await screen.findByText(/Claude Sonnet 4.5/i)
    ).toBeInTheDocument();

    expect(
      await screen.findByText(/GPT-4o/i)
    ).toBeInTheDocument();

    // Click en seleccionar Claude
    const botonClaude = await screen.findByText("Seleccionar Claude");

    fireEvent.click(botonClaude);

    // Verificar mensaje éxito
    expect(
      await screen.findByText(/modelo actualizado correctamente/i)
    ).toBeInTheDocument();

    // Verificar llamada API correcta
    expect(api.actualizarPreferenciaLLM)
      .toHaveBeenCalledWith("testuser", "claude");

  });

  it("muestra error si la API falla", async () => {

    api.obtenerConfiguracionLLM.mockRejectedValue(
      new Error("Fallo de API")
    );

    render(
      <BrowserRouter>
        <ConfiguracionIA />
      </BrowserRouter>
    );

    expect(
      await screen.findByText(/error al cargar configuración de ia/i)
    ).toBeInTheDocument();

  });

});
