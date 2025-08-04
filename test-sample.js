// Simple test to verify the transformation logic without dependencies
// This can be run after npm install is complete

const sampleStoriesContent = `
const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    docs: {
      description: {
        component: \`A versatile button component with multiple variants and sizes.\`
      }
    }
  }
};

export default meta;

export const Primary: Story = {
  name: 'Primary Button',
  story: \`The primary button is used for main actions.\`,
  render: () => {
    return (
      <Button primary size="medium">
        Click me
      </Button>
    );
  }
};

export const Secondary = () => {
  return <Button secondary>Secondary</Button>;
};

export const API: Story = {
  story: \`
## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| primary | boolean | false | Primary button style |
| secondary | boolean | false | Secondary button style |
| size | 'small' | 'medium' | 'large' | 'medium' | Button size |
| children | ReactNode | - | Button content |

## Usage

\\\`\\\`\\\`tsx
import { Button } from './Button';

<Button primary size="large">
  Primary Button
</Button>
\\\`\\\`\\\`
  \`
};
`;

console.log('Sample Storybook file content:');
console.log('=====================================');
console.log(sampleStoriesContent);

console.log('\n\nThis sample contains:');
console.log('- Meta with component description');
console.log('- Primary story (object format with render function)');
console.log('- Secondary story (function format)');
console.log('- API story with markdown documentation');

module.exports = { sampleStoriesContent };