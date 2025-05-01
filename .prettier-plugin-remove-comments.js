module.exports = {
  parsers: {
    typescript: {
      ...require("prettier/parser-typescript").parsers.typescript,
      preprocess: (text, options) => {
        text = text.replace(/\/\*[\s\S]*?\*\//g, '');
        text = text.replace(/([^:])\/\/.*$/gm, '$1');
        return text;
      }
    },
    "typescript-react": {
      ...require("prettier/parser-typescript").parsers["typescript-react"],
      preprocess: (text, options) => {
        text = text.replace(/\/\*[\s\S]*?\*\//g, '');
        text = text.replace(/([^:])\/\/.*$/gm, '$1');
        text = text.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
        return text;
      }
    },
    javascript: {
      ...require("prettier/parser-babel").parsers.babel,
      preprocess: (text, options) => {
        text = text.replace(/\/\*[\s\S]*?\*\//g, '');
        text = text.replace(/([^:])\/\/.*$/gm, '$1');
        return text;
      }
    },
    "babel-flow": {
      ...require("prettier/parser-babel").parsers["babel-flow"],
      preprocess: (text, options) => {
        text = text.replace(/\/\*[\s\S]*?\*\//g, '');
        text = text.replace(/([^:])\/\/.*$/gm, '$1');
        text = text.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
        return text;
      }
    },
    "babel-ts": {
      ...require("prettier/parser-babel").parsers["babel-ts"],
      preprocess: (text, options) => {
        text = text.replace(/\/\*[\s\S]*?\*\//g, '');
        text = text.replace(/([^:])\/\/.*$/gm, '$1');
        text = text.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
        return text;
      }
    }
  }
};