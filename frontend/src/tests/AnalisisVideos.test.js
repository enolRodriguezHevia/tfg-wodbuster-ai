
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import AnalisisVideos from "../pages/AnalisisVideos";
import { BrowserRouter } from "react-router-dom";

jest.mock("../utils/auth", () => ({
  getLoggedUser: () => ({ username: "testuser" }),
  getAuthToken: () => "fake-token"
}));
jest.mock("../utils/videoAnalysis/index", () => ({
  analizarSentadillaVideo: jest.fn(() => Promise.resolve({ feedback: ["Feedback IA"] })),
  analizarPesoMuertoVideo: jest.fn(() => Promise.resolve({ feedback: ["Feedback IA"] })),
  analizarPressHombroVideo: jest.fn(() => Promise.resolve({ feedback: ["Feedback IA"] })),
  analizarRemoBarraVideo: jest.fn(() => Promise.resolve({ feedback: ["Feedback IA"] })),
}));

describe("AnalisisVideos (componente)", () => {
  it("renderiza el selector de ejercicios y el input de video", () => {
    render(
      <BrowserRouter>
        <AnalisisVideos />
      </BrowserRouter>
    );
    expect(screen.getByText(/sentadilla/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sube un video/i)).toBeInTheDocument();
  });

  it("muestra error si se intenta analizar sin seleccionar ejercicio", async () => {
    render(
      <BrowserRouter>
        <AnalisisVideos />
      </BrowserRouter>
    );
    // El botón está deshabilitado si no hay ejercicio ni video, así que forzamos el submit
    const form = screen.getByRole('form') || document.querySelector('form');
    fireEvent.submit(form);
    // Buscar el mensaje de error específico en el div de error
    const errorDiv = await screen.findByText(
      (content, element) =>
        element.tagName.toLowerCase() === "div" &&
        element.className.includes("error-message") &&
        /selecciona un ejercicio/i.test(content)
    );
    expect(errorDiv).toBeInTheDocument();
  });

  it("muestra error si se intenta analizar sin subir video", async () => {
    render(
      <BrowserRouter>
        <AnalisisVideos />
      </BrowserRouter>
    );
    fireEvent.change(screen.getByLabelText(/ejercicio/i), { target: { value: "sentadilla" } });
    // El botón sigue deshabilitado, así que forzamos el submit del formulario
    const form = screen.getByRole('form') || document.querySelector('form');
    fireEvent.submit(form);
    // Buscar el mensaje de error específico en el div de error
    const errorDiv = await screen.findByText(
      (content, element) =>
        element.tagName.toLowerCase() === "div" &&
        element.className.includes("error-message") &&
        /sube un video/i.test(content)
    );
    expect(errorDiv).toBeInTheDocument();
  });
});

describe("AnalisisVideos (componente)", () => {
  it("renderiza el selector de ejercicios y el input de video", () => {
    render(
      <BrowserRouter>
        <AnalisisVideos />
      </BrowserRouter>
    );
    expect(screen.getByText(/sentadilla/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sube un video/i)).toBeInTheDocument();
  });

  it("muestra error si se intenta analizar sin seleccionar ejercicio", async () => {
    render(
      <BrowserRouter>
        <AnalisisVideos />
      </BrowserRouter>
    );
    // El botón está deshabilitado si no hay ejercicio ni video, así que forzamos el submit
    const form = screen.getByRole('form') || document.querySelector('form');
    fireEvent.submit(form);
    // Buscar el mensaje de error específico en el div de error
    const errorDiv = await screen.findByText(
      (content, element) =>
        element.tagName.toLowerCase() === "div" &&
        element.className.includes("error-message") &&
        /selecciona un ejercicio/i.test(content)
    );
    expect(errorDiv).toBeInTheDocument();
  });

  it("muestra error si se intenta analizar sin subir video", async () => {
    render(
      <BrowserRouter>
        <AnalisisVideos />
      </BrowserRouter>
    );
    fireEvent.change(screen.getByLabelText(/ejercicio/i), { target: { value: "sentadilla" } });
    // El botón sigue deshabilitado, así que forzamos el submit del formulario
    const form = screen.getByRole('form') || document.querySelector('form');
    fireEvent.submit(form);
    // Buscar el mensaje de error específico en el div de error
    const errorDiv = await screen.findByText(
      (content, element) =>
        element.tagName.toLowerCase() === "div" &&
        element.className.includes("error-message") &&
        /sube un video/i.test(content)
    );
    expect(errorDiv).toBeInTheDocument();
  });
});
