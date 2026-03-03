const memsPath = "/stickers/mems/"
const MEMS = [
  { id: "mems-1", image: `${memsPath}mems-1.png` },
  { id: "mems-2", image: `${memsPath}mems-2.png` },
  { id: "mems-3", image: `${memsPath}mems-3.png` },
  { id: "mems-4", image: `${memsPath}mems-4.png` },
  { id: "mems-5", image: `${memsPath}mems-5.png` },
  { id: "mems-6", image: `${memsPath}mems-6.png` },
  { id: "mems-7", image: `${memsPath}mems-7.png` },
  { id: "mems-8", image: `${memsPath}mems-8.png` },
  { id: "mems-9", image: `${memsPath}mems-9.png` },
  { id: "mems-10", image: `${memsPath}mems-10.png` },
  { id: "mems-11", image: `${memsPath}mems-11.png` },
  { id: "mems-12", image: `${memsPath}mems-12.png` },
  { id: "mems-13", image: `${memsPath}mems-13.png` },
  { id: "mems-14", image: `${memsPath}mems-14.png` },
]

const capybaraPath = "/stickers/capybara/"
const CAPYBARA = [
  { id: "capybara-1", image: `${capybaraPath}capybara-1.png` },
  { id: "capybara-2", image: `${capybaraPath}capybara-2.png` },
  { id: "capybara-3", image: `${capybaraPath}capybara-3.png` },
  { id: "capybara-4", image: `${capybaraPath}capybara-4.png` },
  { id: "capybara-5", image: `${capybaraPath}capybara-5.png` },
  { id: "capybara-6", image: `${capybaraPath}capybara-6.png` },
  { id: "capybara-7", image: `${capybaraPath}capybara-7.png` },
  { id: "capybara-8", image: `${capybaraPath}capybara-8.png` },
  { id: "capybara-9", image: `${capybaraPath}capybara-9.png` },
  { id: "capybara-10", image: `${capybaraPath}capybara-10.png` },
  { id: "capybara-11", image: `${capybaraPath}capybara-11.png` },
  { id: "capybara-12", image: `${capybaraPath}capybara-12.png` },
  { id: "capybara-13", image: `${capybaraPath}capybara-13.png` },
  { id: "capybara-14", image: `${capybaraPath}capybara-14.png` },
  { id: "capybara-15", image: `${capybaraPath}capybara-15.png` },
  { id: "capybara-16", image: `${capybaraPath}capybara-16.png` },
  { id: "capybara-17", image: `${capybaraPath}capybara-17.png` },
  { id: "capybara-18", image: `${capybaraPath}capybara-18.png` },
  { id: "capybara-19", image: `${capybaraPath}capybara-19.png` },
  { id: "capybara-20", image: `${capybaraPath}capybara-20.png` },
  { id: "capybara-21", image: `${capybaraPath}capybara-21.png` },
  { id: "capybara-22", image: `${capybaraPath}capybara-22.png` },
]

const cthulhuPath = "/stickers/cthulhu/"
const CTHULHU = [
  { id: "cthulhu-1", image: `${cthulhuPath}cthulhu-1.png` },
  { id: "cthulhu-2", image: `${cthulhuPath}cthulhu-2.png` },
  { id: "cthulhu-3", image: `${cthulhuPath}cthulhu-3.png` },
  { id: "cthulhu-4", image: `${cthulhuPath}cthulhu-4.png` },
  { id: "cthulhu-5", image: `${cthulhuPath}cthulhu-5.png` },
  { id: "cthulhu-6", image: `${cthulhuPath}cthulhu-6.png` },
  { id: "cthulhu-7", image: `${cthulhuPath}cthulhu-7.png` },
  { id: "cthulhu-8", image: `${cthulhuPath}cthulhu-8.png` },
]

export type StickersTypeItem = { id: string; image: string }

type StickersType = Record<string, StickersTypeItem[]>

export const STICKERS: StickersType = {
  mems: MEMS,
  capybara: CAPYBARA,
  cthulhu: CTHULHU,
}
