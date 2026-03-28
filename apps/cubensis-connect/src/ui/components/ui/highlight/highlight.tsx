import Prism from 'prismjs';
import invariant from 'tiny-invariant';

interface Props {
  code: string;
  language: string;
}

export function Highlight({ code, language }: Props) {
  const grammar = Prism.languages[language];
  invariant(grammar != null, `Prism: unsupported language '${language}'`);
  return (
    <code
      className={`language-${language}`}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: highlight component sanitizes input via Prism
      dangerouslySetInnerHTML={{
        __html: Prism.highlight(code, grammar, language),
      }}
    />
  );
}
