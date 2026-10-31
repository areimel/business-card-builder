import { evaluate } from '@mdx-js/mdx';
import remarkGfm from 'remark-gfm';
import * as runtime from 'react/jsx-runtime';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { components } from './components/index.js';

/** Compile + evaluate an MDX body and render it to a static HTML string. */
export async function renderMdx(body, extra = {}) {
  const { default: Content } = await evaluate(body, {
    ...runtime,
    remarkPlugins: [remarkGfm],
  });
  return renderToStaticMarkup(createElement(Content, { components: { ...components, ...extra } }));
}
