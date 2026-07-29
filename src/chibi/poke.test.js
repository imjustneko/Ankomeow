import { describe, it, expect, vi } from "vitest";
import { createPokeSender } from "./poke.js";

const makeSender = (over = {}) => {
  const writeDoc = vi.fn(() => Promise.resolve());
  const sendPush = vi.fn(() => Promise.resolve());
  const sender = createPokeSender({ writeDoc, sendPush, partnerName: "Andela", ...over });
  return { sender, writeDoc, sendPush };
};

describe("createPokeSender", () => {
  it("товшилт бүрийг шууд илгээнэ", () => {
    const { sender, writeDoc, sendPush } = makeSender();
    sender.poke(1000);
    sender.poke(2000);
    sender.poke(3000);
    expect(writeDoc).toHaveBeenCalledTimes(3);
    expect(sendPush).toHaveBeenCalledTimes(3);
  });

  it("бичилтэд товшилтын хугацааг дамжуулна", () => {
    const { sender, writeDoc } = makeSender();
    sender.poke(1000);
    expect(writeDoc).toHaveBeenCalledWith({ at: 1000 });
  });

  it("push-ийн гарчиг болон текст зөв", () => {
    const { sender, sendPush } = makeSender();
    sender.poke(1000);
    expect(sendPush.mock.calls[0][0].title).toBe("Ankomeow");
    expect(sendPush.mock.calls[0][0].body).toBe("Andela чамайг товшлоо 💕");
  });

  it("tag товшилт бүрд давтагдахгүй", () => {
    const { sender, sendPush } = makeSender();
    sender.poke(1000);
    sender.poke(2000);
    sender.poke(3000);
    const tags = sendPush.mock.calls.map((c) => c[0].tag);
    expect(new Set(tags).size).toBe(3);
    expect(tags[0]).toBe("poke-1000");
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
