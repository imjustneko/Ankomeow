import { describe, it, expect, vi, afterEach } from "vitest";
import { createPokeSender, PUSH_COALESCE_MS } from "./poke.js";
import { buzzMessage } from "./buzz.js";

const makeSender = (over = {}) => {
  const writeDoc = vi.fn(() => Promise.resolve());
  const sendPush = vi.fn(() => Promise.resolve());
  const sender = createPokeSender({ writeDoc, sendPush, partnerName: "Andela", ...over });
  return { sender, writeDoc, sendPush };
};

describe("createPokeSender", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("Firestore бичилт товшилт бүрд яг нэг удаа хийгдэнэ", () => {
    const { sender, writeDoc } = makeSender();
    sender.poke(1000);
    sender.poke(2000);
    sender.poke(3000);
    expect(writeDoc).toHaveBeenCalledTimes(3);
  });

  it("бичилтэд товшилтын хугацааг дамжуулна", () => {
    const { sender, writeDoc } = makeSender();
    sender.poke(1000);
    expect(writeDoc).toHaveBeenCalledWith({ at: 1000 });
  });

  it("ганц товшилт шууд нэг push илгээнэ (хойшлолгүй)", () => {
    const { sender, writeDoc, sendPush } = makeSender();
    sender.poke(1000);
    expect(sendPush).toHaveBeenCalledTimes(1);
    expect(sendPush.mock.calls[0][0].title).toBe("Ankomeow");
    expect(sendPush.mock.calls[0][0].body).toBe("Andela чамайг товшлоо 💕");
    expect(sendPush.mock.calls[0][0].tag).toBe("poke-1000");
    expect(writeDoc).toHaveBeenCalledTimes(1);
  });

  it("цонх дотор ирсэн гурван товшилт яг хоёр push илгээнэ (шууд + нэгтгэсэн)", () => {
    vi.useFakeTimers();
    const { sender, writeDoc, sendPush } = makeSender();

    sender.poke(1000);
    /* эхний товшилт шууд явна, цонх нээгдэнэ */
    expect(sendPush).toHaveBeenCalledTimes(1);
    expect(sendPush.mock.calls[0][0].body).toBe(buzzMessage("Andela", 1));

    sender.poke(1050);
    sender.poke(1100);
    /* цонх нээлттэй тул нэмэлт push илгээгдэхгүй */
    expect(sendPush).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(PUSH_COALESCE_MS);

    /* цонх хаагдахад хуримтлагдсан 2 товшилтын нэгтгэсэн push илгээгдэнэ */
    expect(sendPush).toHaveBeenCalledTimes(2);
    expect(sendPush.mock.calls[1][0].body).toBe(buzzMessage("Andela", 2));
    /* олон тооны хувилбар */
    expect(sendPush.mock.calls[1][0].body).toBe("Andela чамайг 2 удаа товшлоо 💕");

    /* Firestore бичилт нь коалесцаас үл хамааран товшилт бүрд хийгдсэн */
    expect(writeDoc).toHaveBeenCalledTimes(3);
  });

  it("push tag хоёр илгээлтийн хооронд давтагдахгүй", () => {
    vi.useFakeTimers();
    const { sender, sendPush } = makeSender();
    sender.poke(1000);
    sender.poke(1050);
    sender.poke(1100);
    vi.advanceTimersByTime(PUSH_COALESCE_MS);

    const tags = sendPush.mock.calls.map((c) => c[0].tag);
    expect(new Set(tags).size).toBe(tags.length);
    expect(tags[0]).toBe("poke-1000");
  });

  it("цонх хоосон хаагдвал (хуримтлал 0) нэмэлт push илгээгдэхгүй", () => {
    vi.useFakeTimers();
    const { sender, sendPush } = makeSender();
    sender.poke(1000);
    vi.advanceTimersByTime(PUSH_COALESCE_MS);
    expect(sendPush).toHaveBeenCalledTimes(1);
  });

  it("цонх хаагдсаны дараах товшилт шинэ цонх нээгээд шууд илгээнэ", () => {
    vi.useFakeTimers();
    const { sender, writeDoc, sendPush } = makeSender();
    sender.poke(1000);
    vi.advanceTimersByTime(PUSH_COALESCE_MS);
    expect(sendPush).toHaveBeenCalledTimes(1);

    sender.poke(5000);
    expect(sendPush).toHaveBeenCalledTimes(2);
    expect(sendPush.mock.calls[1][0].body).toBe(buzzMessage("Andela", 1));
    expect(sendPush.mock.calls[1][0].tag).toBe("poke-5000");

    expect(writeDoc).toHaveBeenCalledTimes(2);
  });

  it("push унасан ч бичилт хийгдэнэ", () => {
    const { sender, writeDoc } = makeSender({
      sendPush: () => Promise.reject(new Error("офлайн")),
    });
    expect(() => sender.poke(1000)).not.toThrow();
    expect(writeDoc).toHaveBeenCalledTimes(1);
  });

  it("бичилт унасан ч push илгээгдэнэ", () => {
    const { sender, sendPush } = makeSender({
      writeDoc: () => Promise.reject(new Error("офлайн")),
    });
    expect(() => sender.poke(1000)).not.toThrow();
    expect(sendPush).toHaveBeenCalledTimes(1);
  });

  it("дуудлага өөрөө шидсэн ч UI зогсохгүй", () => {
    const { sender } = makeSender({
      writeDoc: () => { throw new Error("гэнэтийн алдаа"); },
    });
    expect(() => sender.poke(1000)).not.toThrow();
  });
});
