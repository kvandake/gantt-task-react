import { FC, SVGProps } from "react";

export const AddIcon: FC<SVGProps<never>> = props => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    height="24"
    viewBox="0 0 24 24"
    width="24"
    color={'inherit'}
    fill={'inherit'}
    {...props}
  >
    <path d="M0 0h24v24H0z" fill="none" />
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
  </svg>
);
