expect.extend({
  async toHasInDatabase(Model, attributes) {
    const pass = (await Model.where(attributes).count()) > 0;

    return {
      pass,
      message: () => {
        const is = pass ? 'is' : 'is not';
        return [
          this.utils.matcherHint(
            `${this.isNot ? '.not' : ''}.toHasInDatabase`,
            'Model',
            'attributes'
          ),
          '',
          `Received attributes ${is} in database:`,
          `  ${this.utils.printReceived(attributes)}`,
        ].join('\n');
      },
    };
  },
});
