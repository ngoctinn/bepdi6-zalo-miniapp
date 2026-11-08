import React from "react";
import { theme } from "@/constants/copy";

export type SvgProps = React.SVGProps<SVGSVGElement>;

const iconColors = {
  active: "var(--theme-primary, #4D7C0F)", // #4D7C0F — xanh rêu rustic olive khi active
  inactive: "#78716C", // stone-500 — đồng bộ với text-stone-500 của nhãn footer
  accent: "var(--theme-primary, #4D7C0F)",
  white: theme.colors.white,
  black: theme.colors.black,
};

export const navIconColors = iconColors;

export function SearchIcon(props: SvgProps) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.0999 9.9999C4.0999 6.74142 6.74142 4.0999 9.9999 4.0999C13.2584 4.0999 15.8999 6.74142 15.8999 9.9999C15.8999 13.2584 13.2584 15.8999 9.9999 15.8999C6.74142 15.8999 4.0999 13.2584 4.0999 9.9999ZM9.9999 2.8999C6.07868 2.8999 2.8999 6.07868 2.8999 9.9999C2.8999 13.9211 6.07868 17.0999 9.9999 17.0999C11.6723 17.0999 13.2097 16.5216 14.423 15.5542C14.4267 15.558 14.4305 15.5618 14.4343 15.5656L19.4343 20.5656C19.7467 20.8781 20.2532 20.8781 20.5656 20.5656C20.8781 20.2532 20.8781 19.7467 20.5656 19.4343L15.5656 14.4343C15.5618 14.4305 15.558 14.4267 15.5542 14.423C16.5216 13.2097 17.0999 11.6723 17.0999 9.9999C17.0999 6.07868 13.9211 2.8999 9.9999 2.8999Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function HomeIcon({ active }: { active: boolean }) {
  const color = active ? iconColors.active : iconColors.inactive;
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 3C12.5523 3 13 3.44772 13 4V4.08C17.06 4.56 20.25 7.85 20.87 12H3.13C3.75 7.85 6.94 4.56 11 4.08V4C11 3.44772 11.4477 3 12 3Z"
        fill={color}
      />
      <circle cx="12" cy="3" r="1.5" fill={color} />
      <path
        d="M2 14.5C2 13.9477 2.44772 13.5 3 13.5H21C21.5523 13.5 22 13.9477 22 14.5C22 15.0523 21.5523 15.5 21 15.5H3C2.44772 15.5 2 15.0523 2 14.5Z"
        fill={color}
      />
      <path
        d="M4.5 16.5C4.5 16.5 5.5 20 12 20C18.5 20 19.5 16.5 19.5 16.5H4.5Z"
        fill={color}
      />
    </svg>
  );
}
export function OrderIcon({ active }: { active: boolean }) {
  if (active)
    return (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5"
          fill={iconColors.active}
          stroke={iconColors.active}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9 12H15"
          stroke={iconColors.white}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9 16H13"
          stroke={iconColors.white}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );

  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5"
        stroke={iconColors.inactive}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 12H15"
        stroke={iconColors.inactive}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 16H13"
        stroke={iconColors.inactive}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
export function CartNavIcon({ active }: { active: boolean }) {
  if (active)
    return (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M6 2L3 6V20C3 20.5304 3.21071 21.0391 3.58579 21.4142C3.96086 21.7893 4.46957 22 5 22H19C19.5304 22 20.0391 21.7893 20.4142 21.4142C20.7893 21.0391 21 20.5304 21 20V6L18 2H6Z"
          fill={iconColors.active}
        />
        <path
          d="M3 6H21"
          stroke={iconColors.white}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M16 10C16 11.0609 15.5786 12.0783 14.8284 12.8284C14.0783 13.5786 13.0609 14 12 14C10.9391 14 9.92172 13.5786 9.17157 12.8284C8.42143 12.0783 8 11.0609 8 10"
          stroke={iconColors.white}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );

  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 2L3 6V20C3 20.5304 3.21071 21.0391 3.58579 21.4142C3.96086 21.7893 4.46957 22 5 22H19C19.5304 22 20.0391 21.7893 20.4142 21.4142C20.7893 21.0391 21 20.5304 21 20V6L18 2H6Z"
        stroke={iconColors.inactive}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 6H21"
        stroke={iconColors.inactive}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 10C16 11.0609 15.5786 12.0783 14.8284 12.8284C14.0783 13.5786 13.0609 14 12 14C10.9391 14 9.92172 13.5786 9.17157 12.8284C8.42143 12.0783 8 11.0609 8 10"
        stroke={iconColors.inactive}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BackIcon(props: SvgProps) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9.07583 6.07564C9.31015 5.84132 9.69005 5.84132 9.92436 6.07564C10.1587 6.30995 10.1587 6.68985 9.92436 6.92417L5.44863 11.3999L20.0001 11.3999C20.3315 11.3999 20.6001 11.6685 20.6001 11.9999C20.6001 12.3313 20.3315 12.5999 20.0001 12.5999L5.44862 12.5999L9.92436 17.0756C10.1587 17.31 10.1587 17.6899 9.92436 17.9242C9.69005 18.1585 9.31015 18.1585 9.07583 17.9242L3.57583 12.4242C3.34152 12.1899 3.34152 11.81 3.57583 11.5756L9.07583 6.07564Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function TickIcon() {
  return (
    <svg
      className="h-5 w-5 text-white"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="3"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function CartIcon(props: SvgProps) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M9.021 22.25C8.68948 22.2513 8.37101 22.1209 8.13565 21.8874C7.90029 21.6539 7.76733 21.3365 7.766 21.005C7.76467 20.6735 7.8951 20.355 8.12858 20.1196C8.36206 19.8843 8.67948 19.7513 9.011 19.75H9.021C9.35252 19.75 9.67046 19.8817 9.90488 20.1161C10.1393 20.3505 10.271 20.6685 10.271 21C10.271 21.3315 10.1393 21.6495 9.90488 21.8839C9.67046 22.1183 9.35252 22.25 9.021 22.25ZM18.271 21C18.271 20.6685 18.1393 20.3505 17.9049 20.1161C17.6705 19.8817 17.3525 19.75 17.021 19.75H17.011C16.7642 19.752 16.5235 19.827 16.3193 19.9655C16.115 20.104 15.9564 20.3 15.8633 20.5285C15.7702 20.7571 15.7469 21.0081 15.7963 21.2499C15.8456 21.4917 15.9654 21.7135 16.1406 21.8874C16.3159 22.0612 16.5386 22.1792 16.7808 22.2267C17.023 22.2741 17.2738 22.2488 17.5016 22.1539C17.7295 22.059 17.9241 21.8987 18.061 21.6934C18.1979 21.4881 18.271 21.2468 18.271 21ZM13 13.75C12.8011 13.75 12.6103 13.671 12.4697 13.5303C12.329 13.3897 12.25 13.1989 12.25 13C12.25 12.8011 12.329 12.6103 12.4697 12.4697C12.6103 12.329 12.8011 12.25 13 12.25H20.068C20.1399 12.2509 20.2098 12.226 20.2648 12.1797C20.3199 12.1335 20.3565 12.069 20.368 11.998L20.968 8.35999C21.0208 8.07159 21.0095 7.77511 20.935 7.49155C20.8604 7.20799 20.7245 6.94429 20.5367 6.71911C20.3489 6.49394 20.1139 6.3128 19.8484 6.18853C19.5828 6.06426 19.2932 5.9999 19 6H6.941L6.732 4.614C6.64326 3.95638 6.31796 3.35363 5.81695 2.91851C5.31594 2.4834 4.67356 2.24574 4.01 2.25H3.75C3.55109 2.25 3.36032 2.32901 3.21967 2.46967C3.07902 2.61032 3 2.80108 3 3C3 3.19891 3.07902 3.38967 3.21967 3.53033C3.36032 3.67098 3.55109 3.75 3.75 3.75H4C4.30356 3.74981 4.597 3.85913 4.82643 4.05789C5.05587 4.25666 5.20591 4.53151 5.249 4.832L6.75 15.28C6.81626 15.7576 7.05337 16.1951 7.41742 16.5113C7.78146 16.8276 8.24778 17.0012 8.73 17H17C17.3586 17.0524 17.7243 17.0286 18.0731 16.9301C18.4219 16.8317 18.746 16.6609 19.0243 16.4288C19.3027 16.1966 19.529 15.9085 19.6885 15.583C19.848 15.2576 19.9371 14.9022 19.95 14.54L20.021 14.105C20.021 14.105 20.086 13.75 19.749 13.75H13Z"
        fill="currentColor"
      />
    </svg>
  );
}

type CloseIconProps = SvgProps & {
  color?: string;
  size?: number | string;
  strokeWidth?: number;
};

export function CloseIcon({
  color = "currentColor",
  size = 24,
  strokeWidth = 2,
  className,
  ...props
}: CloseIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      strokeWidth={strokeWidth}
      stroke={color}
      className={className}
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

export function MapPinIcon(props: SvgProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
      />
    </svg>
  );
}

export function MapPinIconSolid(props?: SvgProps) {
  return (
    <svg
      width="14"
      height="17"
      viewBox="0 0 14 17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.7088 0C3.0032 0 0 3.01776 0 6.74755C0 8.61246 0.750801 10.2981 1.96662 11.5188L6.7088 16.29L11.451 11.5188C12.7104 10.2497 13.4176 8.53495 13.4176 6.74755C13.4128 3.01774 10.4095 0 6.7088 0ZM6.7088 9.74592C5.9144 9.74592 5.15392 9.42624 4.59685 8.86434C4.03978 8.30245 3.72495 7.54195 3.72495 6.74755C3.72495 5.95315 4.03496 5.19267 4.59685 4.63076C5.1539 4.06887 5.9144 3.75403 6.7088 3.74919C7.5032 3.74919 8.26367 4.06887 8.82074 4.63076C9.37781 5.19266 9.69264 5.95315 9.69264 6.74755C9.69747 7.54195 9.38264 8.30245 8.82074 8.86434C8.25885 9.42624 7.49835 9.74107 6.7088 9.74592Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function ChevronRightIcon(props: SvgProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.25 4.5l7.5 7.5-7.5 7.5"
      />
    </svg>
  );
}

export function ProfileUserIcon(props: SvgProps) {
  return (
    <svg
      width="15"
      height="17"
      viewBox="0 0 15 17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.5 16.6665C5.35875 16.6665 3.74769 16.5139 2.57475 16.2C1.81466 15.9981 1.24501 15.739 0.83325 15.408C0.288133 14.9644 0 14.391 0 13.7498C0 13.1662 0.235433 12.5663 0.69975 11.967C1.11569 11.4516 1.68625 10.9645 2.34975 10.5585C3.81533 9.66086 5.64438 9.1665 7.5 9.1665C9.35562 9.1665 11.1847 9.66086 12.6502 10.5585C13.3137 10.9645 13.8843 11.4516 14.3002 11.967C14.7646 12.5664 15 13.1662 15 13.7498C15 14.391 14.7119 14.9644 14.1667 15.408C13.755 15.739 13.1853 15.9981 12.4253 16.2C11.2523 16.5139 9.64125 16.6665 7.5 16.6665ZM7.5 10.833C5.98042 10.833 4.41924 11.2523 3.21675 11.9835C2.71219 12.2908 2.29439 12.6422 2.0085 12.9998C1.69982 13.3951 1.6665 13.656 1.6665 13.7498C1.6665 13.843 1.69176 13.951 1.875 14.1082C2.09814 14.2864 2.47666 14.4492 3 14.592C4.02362 14.8627 5.53763 15 7.5 15C9.46236 15 10.9764 14.8627 12 14.592C12.5233 14.4492 12.9019 14.2864 13.125 14.1082C13.3082 13.951 13.3335 13.843 13.3335 13.7498C13.3335 13.656 13.3002 13.3951 12.9915 12.9998C12.7056 12.6422 12.2878 12.2908 11.7832 11.9835C10.5808 11.2523 9.01958 10.833 7.5 10.833ZM7.5 8.33325C5.20231 8.33325 3.333 6.46427 3.333 4.167C3.333 1.86931 5.20231 0 7.5 0C9.79769 0 11.667 1.86931 11.667 4.167C11.667 6.46427 9.79769 8.33325 7.5 8.33325ZM7.5 1.6665C6.12163 1.6665 5.00025 2.78822 5.00025 4.167C5.00025 5.54537 6.12163 6.66675 7.5 6.66675C8.87837 6.66675 9.99975 5.54537 9.99975 4.167C9.99975 2.78822 8.87837 1.6665 7.5 1.6665Z"
        fill="#1C1F23"
      />
    </svg>
  );
}

export function VoucherIcon(props: SvgProps) {
  return (
    <svg
      width="17"
      height="14"
      viewBox="0 0 17 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g clipPath="url(#clip0_1_21845)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M13.0419 0H3.13005C1.40147 0 0 1.40147 0 3.13008C0 3.76489 0.341675 4.36592 0.912148 4.64368C1.63076 4.99295 2.08687 5.72194 2.08669 6.52097C2.08669 7.3204 1.63045 8.04922 0.911728 8.39839C0.341675 8.67622 0 9.27698 0 9.91182C0 11.6407 1.40147 13.0419 3.13005 13.0419H13.0419C14.7704 13.0419 16.1719 11.6407 16.1719 9.91182C16.1719 9.27698 15.8302 8.67625 15.2598 8.39818C14.5411 8.04892 14.085 7.31993 14.0852 6.52097C14.0852 5.72145 14.5415 4.99258 15.2602 4.64351C15.8302 4.36592 16.1719 3.76466 16.1719 3.13008C16.1719 1.4015 14.7704 0 13.0419 0ZM13.0419 1.56503C13.905 1.56503 14.6069 2.26669 14.6069 3.13008C14.6069 3.19003 14.5806 3.23128 14.5745 3.2365C13.3267 3.84398 12.5202 5.13329 12.5202 6.52097C12.5202 7.90863 13.3267 9.19794 14.5717 9.80359C14.5806 9.81088 14.6069 9.85184 14.6069 9.91182C14.6069 10.775 13.905 11.4769 13.0419 11.4769H3.13005C2.26693 11.4769 1.56503 10.775 1.56503 9.91182C1.56503 9.85184 1.59135 9.81088 1.59735 9.80542C2.84519 9.19736 3.65171 7.90863 3.65171 6.52097C3.65171 5.13329 2.84519 3.84398 1.60021 3.23857C1.59135 3.23128 1.56501 3.19006 1.56501 3.13008C1.56501 2.26672 2.26693 1.56503 3.13001 1.56503H13.0419Z"
          fill="#1C1F23"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M5.9993 9.65173C5.5672 9.65173 5.2168 9.30139 5.2168 8.8692V4.17413C5.2168 3.74194 5.5672 3.3916 5.9993 3.3916C6.43152 3.3916 6.78189 3.74194 6.78189 4.17413V8.8692C6.78189 9.30139 6.43152 9.65173 5.9993 9.65173Z"
          fill="#1C1F23"
        />
      </g>
      <defs>
        <clipPath id="clip0_1_21845">
          <rect width="16.1719" height="13.042" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

export function TrashIcon(props: SvgProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.75}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
      />
    </svg>
  );
}

export function SupportIcon(props: SvgProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
      />
    </svg>
  );
}

export function StoreIcon({
  active,
  ...props
}: SvgProps & { active?: boolean }) {
  if (active) {
    return (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <path
          d="M3 9L4.5 4H19.5L21 9V11C21 12.1 20.1 13 19 13C17.9 13 17 12.1 17 11C17 12.1 16.1 13 15 13C13.9 13 13 12.1 13 11C13 12.1 12.1 13 11 13C9.9 13 9 12.1 9 11C9 12.1 8.1 13 7 13C5.9 13 5 12.1 5 11V9H3Z"
          fill={iconColors.active}
        />
        <path
          d="M4 13V20C4 20.5523 4.44772 21 5 21H19C19.5523 21 20 20.5523 20 20V13"
          stroke={iconColors.active}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9 21V16C9 15.4477 9.44772 15 10 15H14C14.5523 15 15 15.4477 15 16V21"
          stroke={iconColors.active}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M3 9L4.5 4H19.5L21 9V11C21 12.1 20.1 13 19 13C17.9 13 17 12.1 17 11C17 12.1 16.1 13 15 13C13.9 13 13 12.1 13 11C13 12.1 12.1 13 11 13C9.9 13 9 12.1 9 11C9 12.1 8.1 13 7 13C5.9 13 5 12.1 5 11V9H3Z"
        stroke={iconColors.inactive}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 13V20C4 20.5523 4.44772 21 5 21H19C19.5523 21 20 20.5523 20 20V13"
        stroke={iconColors.inactive}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 21V16C9 15.4477 9.44772 15 10 15H14C14.5523 15 15 15.4477 15 16V21"
        stroke={iconColors.inactive}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PlusIcon(props: SvgProps) {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 11 11"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g clipPath="url(#clip0_1_18876)">
        <path
          d="M0 5.10059H10.2012"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5.10059 10.2012L5.10059 0"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_1_18876">
          <rect width="10.2012" height="10.2012" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

export function CheckIcon(props: SvgProps) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function SparklesIcon(props: SvgProps) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <path d="M12 2L14.4 7.6L20 10L14.4 12.4L12 18L9.6 12.4L4 10L9.6 7.6L12 2Z" />
    </svg>
  );
}

export function FireIcon(props: SvgProps) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}

export function TruckIcon(props: SvgProps) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

export function InfoIcon(props: SvgProps) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

export function AlertCircleIcon(props: SvgProps) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

export function RadioIcon({
  selected,
  className,
  ...props
}: { selected: boolean } & SvgProps) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <circle
        cx="10"
        cy="10"
        r="8.5"
        stroke={selected ? "currentColor" : "#D6D3D1"}
        strokeWidth="2"
      />
      {selected && <circle cx="10" cy="10" r="5" fill="currentColor" />}
    </svg>
  );
}

export function PhoneIcon(props: SvgProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.75}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
      />
    </svg>
  );
}

export function NavigationIcon(props: SvgProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
  );
}

export function CopyIcon(props: SvgProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.75}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"
      />
    </svg>
  );
}

export function DownloadIcon(props: SvgProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.75}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
      />
    </svg>
  );
}

export function PrinterIcon(props: SvgProps) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  );
}

export function MotorbikeIcon(props: SvgProps) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="5" cy="16" r="3" />
      <circle cx="19" cy="16" r="3" />
      <path d="M12 16h-3l2-7h4l2 4h4" />
      <line x1="10" y1="9" x2="8" y2="4" />
    </svg>
  );
}
