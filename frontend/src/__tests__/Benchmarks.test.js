import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import Benchmarks from "../pages/Benchmarks";
import { BrowserRouter } from "react-router-dom";

jest.mock("../utils/auth", () => ({
  getLoggedUser: () => ({ username: "testuser" })
}));

const ejerciciosMock = ["Snatch"];
jest.mock("../api/api", () => ({
  getOneRMExercises: jest.fn().mockImplementation(() => Promise.resolve({ ejercicios: ejerciciosMock })),
  getOneRMHistory: jest.fn(() => Promise.resolve({ registros: [{ id: 1, fecha: new Date().toISOString(), peso: 100 }] })),
  registerOneRM: jest.fn(() => Promise.resolve()),
  deleteOneRM: jest.fn(() => Promise.resolve()),
}));

describe("Benchmarks (componente)", () => {
  it("renderiza la lista de ejercicios y permite seleccionar uno", async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <Benchmarks />
        </BrowserRouter>
      );
    });
    expect(await screen.findByRole('heading', { name: /benchmarks/i })).toBeInTheDocument();
    expect(await screen.findByText(/ejercicios disponibles/i)).toBeInTheDocument();
    expect(await screen.findByText(/snatch/i)).toBeInTheDocument();
    // Seleccionar el botón único de 'Snatch'
    const snatchButton = screen.getByText(/snatch/i).closest('button');
    fireEvent.click(snatchButton);
    expect(await screen.findByText(/registrar nuevo 1rm/i)).toBeInTheDocument();
  });

  it("muestra error si se intenta registrar un 1RM sin peso", async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <Benchmarks />
        </BrowserRouter>
      );
    });
    const snatchButton2 = (await screen.findByText(/snatch/i)).closest('button');
    fireEvent.click(snatchButton2);
    fireEvent.change(screen.getByLabelText(/peso/i), { target: { value: "" } });
    fireEvent.submit(screen.getByRole("form") || document.querySelector("form"));
    expect(await screen.findByText(/el peso debe ser mayor que 0/i)).toBeInTheDocument();
  });

  it("registra un 1RM correctamente", async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <Benchmarks />
        </BrowserRouter>
      );
    });
    const snatchButton3 = (await screen.findByText(/snatch/i)).closest('button');
    fireEvent.click(snatchButton3);
    fireEvent.change(screen.getByLabelText(/peso/i), { target: { value: "120" } });
    fireEvent.submit(screen.getByRole("form") || document.querySelector("form"));
    await waitFor(() => expect(screen.getByText(/1rm registrado con éxito/i)).toBeInTheDocument());
  });
});
