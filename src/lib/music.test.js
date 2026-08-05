import { describe, it, expect } from "vitest";
import { artworkUrl, toSong, parseResults, searchSongs } from "./music.js";

const raw = (over = {}) => ({
  trackId: 1,
  trackName: "Blinding Lights",
  artistName: "The Weeknd",
  artworkUrl100: "https://is1.mzstatic.com/image/thumb/Music125/v4/aa/bb/cc/x/source/100x100bb.jpg",
  previewUrl: "https://audio.example/preview.m4a",
  trackViewUrl: "https://music.apple.com/track/1",
  ...over,
});

describe("artworkUrl", () => {
  it("зургийн хэмжээг сольж илүү тодыг гуйна", () => {
    expect(artworkUrl(raw().artworkUrl100)).toMatch(/\/200x200bb\.jpg$/);
  });

  it("хоосон утгад хоосон буцаана", () => {
    expect(artworkUrl("")).toBe("");
    expect(artworkUrl(undefined)).toBe("");
  });

  it("танихгүй хэлбэрийн замыг гэмтээхгүй", () => {
    const odd = "https://example.com/cover.webp";
    expect(artworkUrl(odd)).toBe(odd);
  });
});

describe("toSong", () => {
  it("хэрэгтэй талбаруудыг гаргаж авна", () => {
    expect(toSong(raw())).toEqual({
      id: "1",
      title: "Blinding Lights",
      artist: "The Weeknd",
      art: expect.stringContaining("200x200"),
      preview: "https://audio.example/preview.m4a",
      url: "https://music.apple.com/track/1",
    });
  });

  it("нэр эсвэл id байхгүй бол null", () => {
    expect(toSong(raw({ trackName: undefined }))).toBeNull();
    expect(toSong(raw({ trackId: undefined }))).toBeNull();
    expect(toSong(null)).toBeNull();
  });

  it("preview байхгүй бол хоосон мөр — дуу нь өөрөө хүчинтэй хэвээр", () => {
    expect(toSong(raw({ previewUrl: undefined })).preview).toBe("");
  });
});

describe("parseResults", () => {
  it("нэг дуу олон цомгоос давхардвал нэгийг л үлдээнэ", () => {
    const json = { results: [raw({ trackId: 1 }), raw({ trackId: 2 }), raw({ trackId: 3, trackName: "Save Your Tears" })] };
    const out = parseResults(json);
    expect(out.map((s) => s.title)).toEqual(["Blinding Lights", "Save Your Tears"]);
  });

  it("limit-ээс илүүг таслана", () => {
    const json = { results: [1, 2, 3, 4].map((n) => raw({ trackId: n, trackName: `Song ${n}` })) };
    expect(parseResults(json, 2)).toHaveLength(2);
  });

  it("буруу хэлбэрийн хариунд хоосон массив", () => {
    expect(parseResults(null)).toEqual([]);
    expect(parseResults({})).toEqual([]);
    expect(parseResults({ results: "not-an-array" })).toEqual([]);
  });
});

describe("searchSongs", () => {
  const okFetch = (json) => async () => ({ ok: true, json: async () => json });

  it("2-оос бага үсэгт хүсэлт огт явуулахгүй", async () => {
    let called = 0;
    const fetchImpl = async () => { called++; return { ok: true, json: async () => ({}) }; };
    expect(await searchSongs("a", { fetchImpl })).toEqual([]);
    expect(await searchSongs("   ", { fetchImpl })).toEqual([]);
    expect(called).toBe(0);
  });

  it("хайлтын үгийг зөв кодлож дуудна", async () => {
    let url = "";
    const fetchImpl = async (u) => { url = u; return { ok: true, json: async () => ({ results: [raw()] }) }; };
    await searchSongs("the weeknd & co", { fetchImpl });
    expect(url).toContain("term=the%20weeknd%20%26%20co");
    expect(url).toContain("entity=song");
  });

  it("HTTP алдаанд шидэж, дуудагч талд мэдэгдэнэ", async () => {
    const fetchImpl = async () => ({ ok: false, status: 503 });
    await expect(searchSongs("test", { fetchImpl })).rejects.toThrow("503");
  });

  it("амжилттай хариуг дууны жагсаалт болгоно", async () => {
    const out = await searchSongs("blinding", { fetchImpl: okFetch({ results: [raw()] }) });
    expect(out).toHaveLength(1);
    expect(out[0].title).toBe("Blinding Lights");
  });
});
