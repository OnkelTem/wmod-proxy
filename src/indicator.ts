import { ResolvedManifest } from './model';

const indicatorStyle = `
  a#wm-indicator {
    display: block;
    position: fixed;
    top: 0;
    left: 2%;
    background: rgba(255, 255, 255, 0.2);
    color: #C4FA58;
    border-radius: 0 0 4px 4px;
    padding: 4px;
    font-family: sans-serif;
    font-weight: bold;
    font-size: 75%;
    text-decoration: none;
    opacity: 0.6;
  }
  a#wm-indicator:hover {
    opacity: 1;
  }
`;

export function getIndicatorScript(manifest: ResolvedManifest) {
  return `
    document.addEventListener('DOMContentLoaded', function () {
      const a = document.createElement('a');
      a.href = '${manifest.homepage}';
      a.textContent = 'WM';
      a.title = \`${manifest.name} ${manifest.version}\n${manifest.description}\`;
      a.setAttribute('id', 'wm-indicator');
      document.body.appendChild(a);
      const style = document.createElement('style');
      style.textContent = \`${indicatorStyle}\`;
      document.head.appendChild(style);
    })
  `;
}
