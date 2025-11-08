"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useAccount } from "wagmi";
import { notification } from "~~/utils/scaffold-eth";

interface Car {
  id: number;
  name: string;
  image: string;
  priceUSD: number;
  installments: number;
  installmentValue: number;
  paidInstallments: number;
  year: number;
  mileage: string;
  color: string;
  vin: string;
  transmission: string;
  fuel: string;
  doors: number;
  features: string[];
}

export default function Home() {
  const { address: connectedAddress } = useAccount();
  const [brlRate, setBrlRate] = useState(5.25);
  const [hoveredCar, setHoveredCar] = useState<number | null>(null);

  const [cars, setCars] = useState<Car[]>([
    {
      id: 1,
      name: "Hyundai HB20",
      image: "/cars/hb20.jpg",
      priceUSD: 12380,
      installments: 12,
      installmentValue: 1031.67,
      paidInstallments: 7,
      year: 2022,
      mileage: "35.000 km",
      color: "Prata",
      vin: "9BWZZZ377VT004251",
      transmission: "Manual",
      fuel: "Flex",
      doors: 4,
      features: ["Ar Condicionado", "Direção Elétrica", "Vidros Elétricos", "Alarme"],
    },
    {
      id: 2,
      name: "Fiat Mobi",
      image: "/cars/mobi.jpg",
      priceUSD: 8571,
      installments: 10,
      installmentValue: 857.1,
      paidInstallments: 0,
      year: 2021,
      mileage: "42.000 km",
      color: "Branco",
      vin: "8AP35710XMB123456",
      transmission: "Manual",
      fuel: "Flex",
      doors: 4,
      features: ["Ar Condicionado", "Direção Hidráulica", "Travas Elétricas"],
    },
    {
      id: 3,
      name: "Volkswagen Nivus",
      image: "/cars/nivus.png",
      priceUSD: 18095,
      installments: 15,
      installmentValue: 1206.33,
      paidInstallments: 0,
      year: 2023,
      mileage: "18.000 km",
      color: "Azul",
      vin: "9BWAA05W3MP001234",
      transmission: "Automático",
      fuel: "Flex",
      doors: 4,
      features: ["Central Multimídia", "Câmera de Ré", "Sensor de Estacionamento", "Ar Digital", "Bancos de Couro"],
    },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setBrlRate(prev => prev + (Math.random() - 0.5) * 0.01);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handlePayInstallment = (carId: number) => {
    const car = cars.find(c => c.id === carId);
    if (!car || car.paidInstallments >= car.installments) return;

    const newPaid = car.paidInstallments + 1;

    setCars(prevCars =>
      prevCars.map(c => {
        if (c.id === carId) {
          return { ...c, paidInstallments: newPaid };
        }
        return c;
      }),
    );

    setTimeout(() => {
      notification.success(`💰 Parcela ${newPaid}/${car.installments} paga com sucesso!`);
      if (newPaid === car.installments) {
        notification.success(`🎉 Pagamento completo! NFT mintado automaticamente via Chainlink Automation!`);
      }
    }, 100);
  };

  const getProgressPercentage = (car: Car) => {
    return (car.paidInstallments / car.installments) * 100;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage === 100) return "bg-green-500";
    if (percentage >= 50) return "bg-blue-500";
    if (percentage >= 25) return "bg-yellow-500";
    return "bg-red-500";
  };

  const convertToBRL = (usd: number) => {
    return (usd * brlRate).toFixed(2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <style jsx global>{`
        header {
          display: none !important;
        }
        .fixed.bottom-0 {
          display: none !important;
        }
        main {
          padding-top: 0 !important;
        }
      `}</style>

      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Image src="/driveFi-logo.png" alt="DriveFi Logo" width={180} height={50} className="object-contain" />
              <div className="border-l border-white/30 pl-4">
                <p className="text-white text-sm font-medium">Propriedade de Veículos Tokenizada na Blockchain</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {connectedAddress && (
                <div className="bg-blue-700 px-4 py-2 rounded-lg">
                  <p className="text-xs text-blue-200">Carteira Conectada</p>
                  <p className="font-mono text-sm">
                    {connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!connectedAddress && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-8 rounded-r-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700 font-semibold">
                  ⚠️ Conecte sua carteira no canto superior direito para pagar parcelas!
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Veículos Disponíveis</h2>
          <p className="mt-2 text-gray-600">Pague parcelado em USDT e receba o NFT de propriedade automaticamente</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cars.map(car => {
            const progress = getProgressPercentage(car);
            const isFullyPaid = progress === 100;
            const isHovered = hoveredCar === car.id;

            return (
              <div
                key={car.id}
                className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 ${isHovered ? "scale-105 shadow-2xl z-10" : "hover:shadow-xl"}`}
                onMouseEnter={() => setHoveredCar(car.id)}
                onMouseLeave={() => setHoveredCar(null)}
              >
                <div className="relative h-48 bg-gray-200">
                  <Image src={car.image} alt={car.name} fill className="object-cover" />
                  {car.paidInstallments > 0 && !isFullyPaid && (
                    <div className="absolute top-3 right-3 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                      🔄 EM ANDAMENTO
                    </div>
                  )}
                  {isFullyPaid && (
                    <div className="absolute top-3 right-3 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                      ✅ NFT MINTADO
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{car.name}</h3>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="grid grid-cols-2 gap-2">
                      <p>
                        <span className="font-semibold">Ano:</span> {car.year}
                      </p>
                      <p>
                        <span className="font-semibold">Km:</span> {car.mileage}
                      </p>
                      <p>
                        <span className="font-semibold">Cor:</span> {car.color}
                      </p>
                      <p>
                        <span className="font-semibold">Portas:</span> {car.doors}
                      </p>
                    </div>
                    <p>
                      <span className="font-semibold">Câmbio:</span> {car.transmission}
                    </p>
                    <p>
                      <span className="font-semibold">Combustível:</span> {car.fuel}
                    </p>
                    <p className="font-mono text-xs text-gray-400 mt-2">VIN: {car.vin}</p>
                  </div>

                  {isHovered && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="text-sm font-bold text-blue-900 mb-2">🎯 Características:</h4>
                      <ul className="text-xs text-blue-700 space-y-1">
                        {car.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center">
                            <span className="mr-2">✓</span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mb-4">
                    <div className="flex justify-between items-baseline mb-1">
                      <div>
                        <span className="text-2xl font-bold text-blue-600">R$ {convertToBRL(car.priceUSD)}</span>
                        <p className="text-xs text-gray-500">${car.priceUSD.toLocaleString("en-US")} USD</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      {car.installments}x de R$ {convertToBRL(car.installmentValue)}
                    </p>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-gray-700">Progresso do Pagamento</span>
                      <span className="text-sm font-bold text-gray-900">
                        {car.paidInstallments}/{car.installments}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full ${getProgressColor(progress)} transition-all duration-500 ease-out`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-right">{progress.toFixed(0)}% concluído</p>
                  </div>

                  <div className="space-y-2">
                    {!isFullyPaid ? (
                      <button
                        onClick={() => handlePayInstallment(car.id)}
                        disabled={!connectedAddress}
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {connectedAddress
                          ? `💰 Pagar Parcela ${car.paidInstallments + 1}/${car.installments}`
                          : "⚠️ Conecte a Carteira"}
                      </button>
                    ) : (
                      <div className="w-full bg-green-100 border-2 border-green-600 text-green-800 py-3 px-4 rounded-lg text-center font-semibold">
                        <div className="flex items-center justify-center space-x-2">
                          <span>✅</span>
                          <span>NFT Mintado Automaticamente</span>
                        </div>
                        <p className="text-xs text-green-600 mt-1">via Chainlink Automation</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-gray-50 mt-16 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Como Funciona?</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">1️⃣</span>
                </div>
                <h4 className="font-semibold text-gray-900">Escolha o Veículo</h4>
                <p className="text-sm text-gray-600 mt-2">Selecione o carro que deseja comprar</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">2️⃣</span>
                </div>
                <h4 className="font-semibold text-gray-900">Pague Parcelado</h4>
                <p className="text-sm text-gray-600 mt-2">Realize os pagamentos em USDT</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">3️⃣</span>
                </div>
                <h4 className="font-semibold text-gray-900">Automação Chainlink</h4>
                <p className="text-sm text-gray-600 mt-2">Sistema verifica pagamento completo</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">4️⃣</span>
                </div>
                <h4 className="font-semibold text-gray-900">Receba o NFT</h4>
                <p className="text-sm text-gray-600 mt-2">Propriedade transferida automaticamente</p>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                💱 Taxa de câmbio BRL/USD: R$ {brlRate.toFixed(4)} | Atualizado via Chainlink Price Feeds
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
