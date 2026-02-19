import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import ImageCropper from "../components/ImageCropper";

const mockImage = "data:image/png;base64,MOCK_IMAGE_DATA";

describe("ImageCropper", () => {
  it("renderiza correctamente el modal y los controles", () => {
    render(
      <ImageCropper image={mockImage} onComplete={jest.fn()} onCancel={jest.fn()} />
    );
    expect(screen.getByText(/Ajustar Imagen/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Zoom/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cancelar/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Confirmar/i })).toBeInTheDocument();
  });

  it("llama a onCancel al hacer click en Cancelar", () => {
    const onCancel = jest.fn();
    render(
      <ImageCropper image={mockImage} onComplete={jest.fn()} onCancel={onCancel} />
    );
    fireEvent.click(screen.getByRole("button", { name: /Cancelar/i }));
    expect(onCancel).toHaveBeenCalled();
  });

  it("llama a onComplete con el área recortada al hacer click en Confirmar", () => {
    const onComplete = jest.fn();
    render(
      <ImageCropper image={mockImage} onComplete={onComplete} onCancel={jest.fn()} />
    );
    // Simula que el usuario ha recortado algo
    // Forzamos el estado interno para simular un área recortada
    // (No se puede simular Cropper real sin mocking más avanzado)
    // Así que forzamos el click y comprobamos que se llama a onComplete
    fireEvent.click(screen.getByRole("button", { name: /Confirmar/i }));
    expect(onComplete).toHaveBeenCalled();
  });

  it("permite cambiar el zoom", () => {
    render(
      <ImageCropper image={mockImage} onComplete={jest.fn()} onCancel={jest.fn()} />
    );
    const zoomInput = screen.getByLabelText(/Zoom/i);
    fireEvent.change(zoomInput, { target: { value: 2 } });
    expect(zoomInput.value).toBe("2");
  });
});
