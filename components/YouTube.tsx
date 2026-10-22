"use client";

import { useState } from "react";

// A YouTube video that loads only when clicked: until then it is the video's
// thumbnail and a play button, so a page with several videos stays light and
// nothing is fetched from YouTube's player for people who never press play.
// Plays from youtube-nocookie.com with Korean captions when the video has them.
export function YouTube({ id, title, channel, length }: { id: string; title: string; channel: string; length: string }) {
  const [playing, setPlaying] = useState(false);
  return (
    <figure className="video">
      <div className="video__frame">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&hl=ko&cc_lang_pref=ko&cc_load_policy=1`}
            title={title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <button type="button" className="video__poster" onClick={() => setPlaying(true)} aria-label={`영상 재생: ${title}`}>
            {/* eslint-disable-next-line @next/next/no-img-element -- remote thumbnail, shown as is */}
            <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" />
            <span className="video__play" aria-hidden="true" />
          </button>
        )}
      </div>
      <figcaption>
        <a href={`https://www.youtube.com/watch?v=${id}`} target="_blank" rel="noopener noreferrer">
          {title}
        </a>{" "}
        <span className="video__meta">
          {channel} · {length}
        </span>
      </figcaption>
    </figure>
  );
}
