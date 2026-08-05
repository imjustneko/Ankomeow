import { describe, it, expect } from "vitest";
import { toSong, parseResults, searchSongs, freshPreview } from "./music.js";

const track = (over = {}) => ({
  id: 2600565262,
  title: "want u",
  link: "https://www.deezer.com/track/2600565262",
  preview: "https://cdnt-preview.dzcdn.net/x.mp3?hdnea=exp=1785903240",
  artist: { name: "noevdv" },
  album: {
    cover_small: "https://cdn-images.dzcdn.net/a/56x56.jpg",
    cover_medium: "https://cdn-images.dzcdn.net/a/250x250.jpg",
  },
  ...over,
});

describe("toSong", () => {
  it("хэрэгтэй талбаруудыг гаргаж авна", () => {
    expect(toSong(track())).toEqual({
      id: "2600565262",
      src: "deezer",
      title: "want u",
      artist: "noevdv",
      art: "https://cdn-images.dzcdn.net/a/250x250.jpg",
      preview: "https://cdnt-preview.dzcdn.net/x.mp3?hdnea=exp=1785903240",
      url: "https://www.deezer.com/track/2600565262",
    });
  });

  it("дунд зэргийн зураг байхгүй бол жижгээр нь орлуулна", () => {
    const s = toSong(track({ album: { cover_small: "small.jpg" } }));
    expect(s.art).toBe("small.jpg");
  });

  it("нэр эсвэл id байхгүй бол null", () => {
    expect(toSong(track({ title: undefined }))).toBeNull();
    expect(toSong(track({ id: undefined }))).toBeNull();
    expect(toSong(null)).toBeNull();
  });

  it("preview байхгүй бол хоосон мөр — дуу нь өөрөө хүчинтэй хэвээр", () => {
    expect(toSong(track({ preview: undefined })).preview).toBe("");
  });
});

describe("parseResults", () => {
  it("нэг дуу олон цомгоос давхардвал нэгийг л үлдээнэ", () => {
    const json = { data: [track({ id: 1 }), track({ id: 2 }), track({ id: 3, title: "Clara" })] };
    expect(parseResults(json).map((s) => s.title)).toEqual(["want u", "Clara"]);
  });

  it("limit-ээс илүүг таслана", () => {
    const json = { data: [1, 2, 3, 4].map((n) => track({ id: n, title: `Song ${n}` })) };
    expect(parseResults(json, 2)).toHaveLength(2);
  });

  it("буруу хэлбэрийн хариунд хоосон массив", () => {
    expect(parseResults(null)).toEqual([]);
    expect(parseResults({})).toEqual([]);
    expect(parseResults({ data: "not-an-array" })).toEqual([]);
  });
});

describe("searchSongs", () => {
  it("2-оос бага үсэгт хүсэлт огт явуулахгүй", async () => {
    let called = 0;
    const jsonpImpl = async () => { called++; return { data: [] }; };
    expect(await searchSongs("a", { jsonpImpl })).toEqual([]);
    expect(await searchSongs("   ", { jsonpImpl })).toEqual([]);
    expect(called).toBe(0);
  });

  it("хайлтын үгийг зөв кодлож дуудна", async () => {
    let url = "";
    const jsonpImpl = async (u) => { url = u; return { data: [track()] }; };
    await searchSongs("noevdv & co", { jsonpImpl });
    expect(url).toContain("/search?q=noevdv%20%26%20co");
  });

  it("Deezer алдаа буцаавал шидэж, дуудагч талд мэдэгдэнэ", async () => {
    const jsonpImpl = async () => ({ error: { message: "Quota limit exceeded" } });
    await expect(searchSongs("test", { jsonpImpl })).rejects.toThrow("Quota");
  });

  it("амжилттай хариуг дууны жагсаалт болгоно", async () => {
    const out = await searchSongs("want u", { jsonpImpl: async () => ({ data: [track()] }) });
    expect(out).toHaveLength(1);
    expect(out[0].artist).toBe("noevdv");
  });
});

describe("freshPreview", () => {
  it("Deezer дууны шинэ холбоосыг дугаараар нь татна", async () => {
    let url = "";
    const jsonpImpl = async (u) => { url = u; return { preview: "https://new.mp3" }; };
    const out = await freshPreview(toSong(track()), { jsonpImpl });
    expect(url).toContain("/track/2600565262");
    expect(out).toBe("https://new.mp3");
  });

  it("Deezer биш дуунд сүлжээ хөдөлгөхгүй — хуучин холбоос хугацаагүй", async () => {
    let called = 0;
    const jsonpImpl = async () => { called++; return {}; };
    const old = { id: "1", src: "itunes", preview: "https://itunes/x.m4a" };
    expect(await freshPreview(old, { jsonpImpl })).toBe("https://itunes/x.m4a");
    expect(called).toBe(0);
  });

  it("шинэ холбоос ирээгүй бол хуучныг үлдээнэ", async () => {
    const s = toSong(track());
    const out = await freshPreview(s, { jsonpImpl: async () => ({}) });
    expect(out).toBe(s.preview);
  });
});
