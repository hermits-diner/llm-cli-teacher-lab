import { Icon, type IconName } from "@/components/Icon";

// The order of agent coding, drawn as one slide: five steps left to right,
// with a return arrow under 실행 → 고치기 because that loop repeats until the
// result is right. Stacks vertically on narrow screens.
const STEPS: { icon: IconName; title: string; text: string }[] = [
  { icon: "folder", title: "준비", text: "작업 폴더와 업무 지침서(AGENTS.md)" },
  { icon: "hello", title: "부탁", text: "만들 것을 평소 말로" },
  { icon: "terminal", title: "실행", text: "AI가 읽고, 만들고, 실행. 선생님은 지켜보기" },
  { icon: "eye", title: "확인", text: "결과를 직접 열어 보기" },
  { icon: "pencil", title: "고치기", text: "바꿀 점을 다시 말로" },
];

export function AgentFlow() {
  return (
    <div className="flow">
      <ol className="flow__steps">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flow__step">
            <span className="flow__num">{i + 1}</span>
            <Icon name={s.icon} className="flow__icon" />
            <strong className="flow__title">{s.title}</strong>
            <span className="flow__text">{s.text}</span>
          </li>
        ))}
      </ol>
      <p className="flow__loop">
        <span className="flow__loop-label">3~5를 마음에 들 때까지 반복</span>
      </p>
    </div>
  );
}
