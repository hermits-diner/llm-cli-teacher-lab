import Image from "next/image";

// One wide photo under each period page's lead, so the pages are not all
// text. All from Unsplash (free under the Unsplash License), saved in
// public/images/photos at 1600px; `position` keeps the subject inside the
// wide crop.
const PHOTOS = {
  intro: {
    alt: "어두운 방에서 노트북 화면에 명령창 글자가 떠 있다",
    name: "Ilnur",
    user: "mrw0rld",
    photo: "sxK8RUCpqoQ",
    position: "50% 30%",
  },
  prepare: {
    alt: "나무 책상 위에 노트북, 머그잔, 메모지와 펜, 휴대폰이 놓여 있다",
    name: "Andrew Neel",
    user: "andrewtneel",
    photo: "cckf4TsHAuw",
    position: "50% 55%",
  },
  start: {
    alt: "화분 옆에서 노트북 자판을 두드리는 두 손",
    name: "Jakub Żerdzicki",
    user: "jakubzerdzicki",
    photo: "W11cPpQAQ_0",
    position: "60% 55%",
  },
  "mission-1": {
    alt: "노트북 앞에서 웹페이지가 열린 휴대폰을 들고 있는 손",
    name: "Lilly Rum",
    user: "rumandraisin",
    photo: "15YTRXKuJ14",
    position: "60% 60%",
  },
  "mission-2": {
    alt: "인쇄된 서류 더미 위에 만년필이 놓여 있다",
    name: "Andres Vera",
    user: "canonvera",
    photo: "OJbjBsNIwjk",
    position: "50% 50%",
  },
  "wrap-up": {
    alt: "교실 책상에서 두 사람이 노트북 화면을 함께 보며 이야기한다",
    name: "Centre for Ageing Better",
    user: "ageing_better",
    photo: "ukDFRP2RNA0",
    position: "60% 35%",
  },
} as const;

export function PagePhoto({ id }: { id: keyof typeof PHOTOS }) {
  const p = PHOTOS[id];
  return (
    <figure className="page-photo">
      <Image
        src={`/images/photos/${id}.jpg`}
        alt={p.alt}
        width={1600}
        height={1067}
        sizes="(max-width: 760px) 100vw, 44rem"
        style={{ objectPosition: p.position }}
        priority
      />
      <figcaption>
        사진:{" "}
        <a href={`https://unsplash.com/@${p.user}`} target="_blank" rel="noopener noreferrer">
          {p.name}
        </a>
        ,{" "}
        <a href={`https://unsplash.com/photos/${p.photo}`} target="_blank" rel="noopener noreferrer">
          Unsplash
        </a>
      </figcaption>
    </figure>
  );
}
