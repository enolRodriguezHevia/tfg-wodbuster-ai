import * as api from "../api/api";
beforeEach(() => {
  jest.clearAllMocks();
  // Restaurar mocks a su valor por defecto antes de cada test
  api.generarPlanEntrenamiento.mockImplementation(() =>
    new Promise((resolve) =>
      setTimeout(() => resolve({ success: true, plan: "# Plan generado\n- Día 1: Sentadilla", advertencia: null }), 100)
    )
  );
  api.obtenerPlanesAnteriores.mockImplementation(() => Promise.resolve({ success: true, planes: [] }));
  api.eliminarPlan.mockImplementation(() => Promise.resolve({ success: true }));
});

import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import PlanEntrenamiento from "../pages/PlanEntrenamiento";
import { BrowserRouter } from "react-router-dom";

const apiMocks = {
  generarPlanEntrenamiento: jest.fn(() =>
    new Promise((resolve) =>
      setTimeout(() => resolve({ success: true, plan: "# Plan generado\n- Día 1: Sentadilla", advertencia: null }), 100)
    )
  ),
  obtenerPlanesAnteriores: jest.fn(() => Promise.resolve({ success: true, planes: [] })),
  eliminarPlan: jest.fn(() => Promise.resolve({ success: true }))
};
jest.mock("../api/api", () => {
  const generarPlanEntrenamiento = jest.fn(() =>
    new Promise((resolve) =>
      setTimeout(() => resolve({ success: true, plan: "# Plan generado\n- Día 1: Sentadilla", advertencia: null }), 100)
    )
  );
  const obtenerPlanesAnteriores = jest.fn(() => Promise.resolve({ success: true, planes: [] }));
  const eliminarPlan = jest.fn(() => Promise.resolve({ success: true }));
  return {
    generarPlanEntrenamiento,
    obtenerPlanesAnteriores,
    eliminarPlan
  };
});
afterEach(() => {
  jest.clearAllMocks();
});

jest.mock("../utils/auth", () => ({
  getLoggedUser: () => ({ username: "testuser" })
}));

describe("PlanEntrenamiento (componente)", () => {
  it("renderiza y permite generar un plan", async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <PlanEntrenamiento />
        </BrowserRouter>
      );
    });
    expect(
      await screen.findByRole("heading", { name: /plan de entrenamiento personalizado/i })
    ).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/ej: semana 1/i), { target: { value: "Mi plan test" } });
    fireEvent.click(screen.getByText(/generar plan de entrenamiento/i));
    // Esperar a que aparezca la card del plan generado
    expect(
      await screen.findByRole("heading", { name: /plan de entrenamiento generado/i }, { timeout: 2000 })
    ).toBeInTheDocument();
    // Simular clic en "Ver Plan Completo" para abrir el modal
    fireEvent.click(screen.getByRole("button", { name: /ver plan completo/i }));
    // Comprobar que el contenido del plan aparece en el modal
    expect(await screen.findByText(/día 1: sentadilla/i)).toBeInTheDocument();
  });

  it("muestra error si la API falla", async () => {
    jest.spyOn(require("../api/api"), "generarPlanEntrenamiento").mockImplementationOnce(() => Promise.reject(new Error("Fallo de API")));
    await act(async () => {
      render(
        <BrowserRouter>
          <PlanEntrenamiento />
        </BrowserRouter>
      );
    });
    fireEvent.click(screen.getByText(/generar plan de entrenamiento/i));
    // Acepta tanto el mensaje de error genérico como el de la excepción
    expect(
      await screen.findByText(
        (content) =>
          /fallo de api/i.test(content) || /error al generar el plan de entrenamiento/i.test(content)
      )
    ).toBeInTheDocument();
  });
});
