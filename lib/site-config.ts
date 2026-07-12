export const siteConfig = {
  name: "SITUR Turismo",
  tagline: "Sua próxima viagem começa aqui",
  phone: "(48) 99617-1949",
  phone2: "(48) 99664-4172",
  whatsapp: "5548996171949",
  whatsappDisplay: "(48) 99617-1949",
  instagram: "https://www.instagram.com/situr.sc/",
  // Enquanto a página do Facebook não existe, aponta para o Instagram
  facebook: "https://www.instagram.com/situr.sc/",
  // Cadastur usa o mesmo número do CNPJ
  cnpjNumber: "67.500.979/0001-38",
  registrationLabel: "Registro Cadastur/CNPJ",
  address: "Rua das Palmeiras, 123 — Centro, Blumenau/SC",
  mapEmbedUrl:
    "https://www.google.com/maps?q=Blumenau,+SC,+Brasil&output=embed",
  email: "contato@siturturismo.com.br",
  stats: [
    { value: 4000, suffix: "+", label: "Pessoas transportadas" },
    { value: 60, suffix: "+", label: "Viagens realizadas" },
    { value: 20, suffix: "+", label: "Destinos visitados" },
    { value: 10, suffix: "", label: "Anos de experiência" },
  ],
};

export function whatsappLink(message?: string) {
  const text = encodeURIComponent(
    message ?? "Olá! Gostaria de mais informações sobre as viagens da SITUR."
  );
  return `https://wa.me/${siteConfig.whatsapp}?text=${text}`;
}
