export const stripMarkdownArtifacts = (text = '') =>
  text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[\[[^\]]+\]\]/g, ' ')
    .replace(/img-\d+\.jpeg/gi, ' ');
