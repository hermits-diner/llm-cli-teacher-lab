import type { Metadata } from "next";
import { GalleryBoard } from "@/components/GalleryBoard";
import { GALLERY_BACKUP_URL } from "@/lib/site";

export const metadata: Metadata = { title: "결과물 갤러리" };

export default function GalleryPage() {
  return (
    <>
      <h1>결과물 갤러리</h1>
      <p className="lead">
        2교시에 Netlify에 올린 웹페이지 주소를 올려 주세요. 다른 선생님들의 페이지를 휴대폰으로 열어 구경할 수
        있습니다. 목록은 10초마다 새로 고쳐집니다.
      </p>
      <div className="callout callout--warn">
        <p className="callout__title">닉네임만 적어 주세요</p>
        <p>이 목록은 연수 참여자 모두에게 보입니다. 실명, 학교 이름, 학생 정보는 적지 마세요.</p>
      </div>
      <GalleryBoard backupUrl={GALLERY_BACKUP_URL} />
    </>
  );
}
