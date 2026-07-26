export const SOURCE_BRANDS = Object.freeze({
  "Pakistan Telecommunication Authority": {
    asset: "./assets/source-logos/pta.ico",
  },
  "Ministry of Information Technology and Telecommunication": {
    asset: "./assets/source-logos/moitt.png",
    tone: "dark",
  },
  "National Information Technology Board": {
    asset: "./assets/source-logos/nitb.png",
    tone: "dark",
  },
  "Pakistan Bureau of Statistics": {
    asset: "./assets/source-logos/pbs.png",
  },
  "State Bank of Pakistan": {
    asset: "./assets/source-logos/sbp.png",
  },
  "Finance Division, Government of Pakistan": {
    asset: "./assets/source-logos/finance-division.png",
  },
  "Pakistan Digital Authority": {
    asset: "./assets/source-logos/pakistan-digital-authority.png",
  },
  "International Telecommunication Union": {
    asset: "./assets/source-logos/itu.svg",
  },
  "World Bank": {
    asset: "./assets/source-logos/world-bank.png",
  },
  "United Nations Department of Economic and Social Affairs": {
    asset: "./assets/source-logos/un-desa.ico",
  },
  "United Nations Conference on Trade and Development": {
    asset: "./assets/source-logos/unctad.ico",
  },
  "World Intellectual Property Organization": {
    asset: "./assets/source-logos/wipo.svg",
  },
  "World Trade Organization": {
    asset: "./assets/source-logos/wto.ico",
  },
  "UNESCO Institute for Statistics": {
    asset: "./assets/source-logos/unesco-uis.png",
  },
  "International Monetary Fund": {
    asset: "./assets/source-logos/imf.ico",
  },
});

export function getSourceBrand(publisher) {
  return SOURCE_BRANDS[publisher] ?? null;
}
