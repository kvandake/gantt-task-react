import { Gantt } from "../src";
import { FreezeDatesStory } from "./FreezeDates";

// eslint-disable-next-line
const Template = (props: any) => {
  return <FreezeDatesStory {...props} />;
};

export default {
  title: "FreezeDates",
  component: Gantt,
  parameters: {
    layout: "fullscreen",
  },
};

export const FreezeDatesDemo = {
  render: Template.bind({}),
  name: "FreezeDates",
};

