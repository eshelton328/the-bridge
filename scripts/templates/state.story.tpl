
export const {{Story}}: Story = {
  name: '{{frame}}: TODO what this state shows',
  args: { data: {{page}}States.{{id}}.data, ui: {{page}}States.{{id}}.ui, viewport: 'desktop' },
  globals: { viewport: { value: 'desktop', isRotated: false } },
  play: async ({ canvas }) => {
    // TODO: check text that only this state shows.
    await expect(canvas.getByText('TODO: text only this state shows')).toBeVisible()
  },
}
