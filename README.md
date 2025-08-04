# @atom/storybook-to-md

Transform Storybook stories to Markdown documentation. Support both direct story object transformation and file-based parsing.

## Installation

```bash
npm install @atom/storybook-to-md
```

## Features

- ✅ Parse `.stories.tsx` files directly
- ✅ Extract demo examples and API documentation
- ✅ Support both object and function story formats
- ✅ Customizable markdown output
- ✅ Batch processing for multiple components
- ✅ TypeScript support with full type definitions
- ✅ Legacy API compatibility

## Usage

### Transform from Stories File

```typescript
import { transformStoriesFileToMd } from '@atom/storybook-to-md';

// Transform from file path
const result = await transformStoriesFileToMd(
  './src/Button/Button.stories.tsx',
  'Button',
  {
    enableChineseOutput: true,
    codeLanguage: 'tsx'
  }
);

console.log(result.content);
```

### Transform by Component Name

```typescript
import { transformComponentToMd } from '@atom/storybook-to-md';

// Transform by component name (with custom file path pattern)
const result = await transformComponentToMd(
  'Button',
  {
    enableChineseOutput: true,
    includeSource: true
  },
  {
    baseDir: process.cwd(),
    storiesPathPattern: 'packages/{componentName}/src/index.stories.tsx'
  }
);
```

### Batch Process Multiple Components

```typescript
import { generateComponentMarkdown } from '@atom/storybook-to-md';

const results = await generateComponentMarkdown(
  ['Button', 'Input', 'Modal'],
  { enableChineseOutput: true },
  { storiesPathPattern: 'src/{componentName}/{componentName}.stories.tsx' }
);

results.forEach(({ componentName, result, error }) => {
  if (error) {
    console.error(`Failed: ${componentName}`, error.message);
  } else {
    console.log(`Success: ${componentName}`);
    // Write result.content to file
  }
});
```

### Legacy API (Still Supported)

```typescript
import { transformStorybookToMd } from '@atom/storybook-to-md';

const story = {
  id: 'button--primary',
  title: 'Button',
  name: 'Primary',
  args: {
    label: 'Click me',
    primary: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'A primary button component'
      }
    },
    storySource: {
      source: '<Button primary label="Click me" />'
    }
  }
};

const result = transformStorybookToMd(story);
console.log(result.content);
```

### Transform Multiple Stories

```typescript
const stories = [story1, story2, story3];
const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    docs: {
      description: {
        component: 'Button component documentation'
      }
    }
  }
};

const result = transformStorybookToMd(stories, meta);
console.log(result.content);
```

### Options

```typescript
const options = {
  includeSource: true,    // Include story source code
  includeArgs: true,      // Include story args/controls
  format: 'markdown',     // 'markdown' or 'mdx'
  titleTransform: (title) => title.toUpperCase()
};

const result = transformStorybookToMd(story, meta, options);
```

## API

### `transformStorybookToMd(stories, meta?, options?)`

Transform Storybook stories to Markdown.

- `stories`: `StorybookStory | StorybookStory[]` - Single story or array of stories
- `meta?`: `StorybookMeta` - Optional Storybook meta information
- `options?`: `TransformOptions` - Optional transform options

Returns `MarkdownOutput` with `content` and optional `frontmatter`.

### `transformMetaToMd(meta, options?)`

Transform Storybook meta to Markdown documentation.

- `meta`: `StorybookMeta` - Storybook meta information
- `options?`: `TransformOptions` - Optional transform options

## Types

### `StorybookStory`

```typescript
interface StorybookStory {
  id: string;
  title: string;
  name: string;
  parameters?: Record<string, any>;
  args?: Record<string, any>;
  argTypes?: Record<string, any>;
  component?: any;
}
```

### `StorybookMeta`

```typescript
interface StorybookMeta {
  title: string;
  component?: any;
  parameters?: Record<string, any>;
  args?: Record<string, any>;
  argTypes?: Record<string, any>;
  decorators?: any[];
}
```

### `TransformOptions`

```typescript
interface TransformOptions {
  includeSource?: boolean;
  includeArgs?: boolean;
  template?: string;
  format?: 'markdown' | 'mdx';
  titleTransform?: (title: string) => string;
}
```

## License

MIT