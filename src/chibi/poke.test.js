import { describe, it, expect, vi } from "vitest";
import { createPokeSender, pokeMessage, POKE_THROTTLE_MS } from "./poke.js";

const makeSender = (over = {}) => {
  const writeDoc = vi.fn(() => Promise.resolve());
  const sendPush = vi.fn(() => Promise.resolve());
  const sender = createPokeSender({ writeDoc, sendPush, partnerName: "Andela", ...over });
  return { sender, writeDoc, sendPush };
};

describe("pokeMessage", () => {
  it("нэг товшилтод ганц тооны текст", () => {
    expect(pokeMessage("Andela", 1)).toBe("Andela чамайг товшлоо 💕");
  });

  it("олон товшилтыг тоогоор нэгтгэнэ", () => {
    expect(pokeMessage("Andela", 5)).toBe("Andela чамайг 5 удаа товшлоо 💕");
  });
});

describe("createPokeSender", () => {
  it("эхний товшилтыг шууд илгээнэ", () => {
    const { sender, writeDoc, sendPush } = makeSender();
    sender.poke(1000);
    expect(writeDoc).toHaveBeenCalledTimes(1);
    expect(writeDoc).toHaveBeenCalledWith({ count: 1 });
    expect(sendPush).toHaveBeenCalledTimes(1);
    expect(sendPush.mock.calls[0][0].body).toBe("Andela чамайг товшлоо 💕");
  });

  it("throttle дотор дахин илгээхгүй", () => {
    const { sender, writeDoc, sendPush } = makeSender();
    sender.poke(1000);
    sender.poke(2000);
    sender.poke(3000);
    expect(writeDoc).toHaveBeenCalledTimes(1);
    expect(sendPush).toHaveBeenCalledTimes(1);
  });

  it("throttle дуусахад хуримтлагдсан тоог нэгтгэж илгээнэ", () => {
    const { sender, sendPush, writeDoc } = makeSender();
    sender.poke(1000);
    sender.poke(2000);
    sender.poke(3000);
    sender.poke(1000 + POKE_THROTTLE_MS);
    expect(writeDoc).toHaveBeenCalledTimes(2);
    expect(writeDoc.mock.calls[1][0]).toEqual({ count: 3 });
    expect(sendPush.mock.calls[1][0].body).toBe("Andela чамайг 3 удаа товшлоо 💕");
  });

  it("throttle дууссаны дараа хуримтлал тэглэгдэнэ", () => {
    const { sender, sendPush } = makeSender();
    sender.poke(1000);
    sender.poke(2000);
    sender.poke(1000 + POKE_THROTTLE_MS);
    sender.poke(1000 + POKE_THROTTLE_MS * 2);
    expect(sendPush.mock.calls[2][0].body).toBe("Andela чамайг товшлоо 💕");
  });

  it("сүлжээ унасан ч алдаа шидэхгүй", () => {
    const { sender } = makeSender({
      writeDoc: () => Promise.reject(new Error("офлайн")),
      sendPush: () => Promise.reject(new Error("офлайн")),
    });
    expect(() => sender.poke(1000)).not.toThrow();
  });

  it("push-ийн гарчиг болон tag тогтмол", () => {
    const { sender, sendPush } = makeSender();
    sender.poke(1000);
    expect(sendPush.mock.calls[0][0].title).toBe("Ankomeow");
    expect(sendPush.mock.calls[0][0].tag).toBe("poke");
  });
});
