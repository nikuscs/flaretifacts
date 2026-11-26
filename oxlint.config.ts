import { preset } from 'oxlint-plugin-arch/preset';

const config = preset({
  root: import.meta.dirname,
  folders: {
    'src/components/providers': {
      rules: { 'react-extra/hook-use-state': 'off' },
    },
  },
});

export default config;
