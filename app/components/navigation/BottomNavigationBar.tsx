// app/components/navigation/BottomNavigationBar.tsx
import { useStore } from '@nanostores/react';
import { useNavigate } from '@remix-run/react';
import { classNames } from '~/utils/classNames';
import { toggleSidebar as toggleSidebarStoreAction } from '~/lib/stores/sidebarStore';
import { openSettingsModal as openSettingsModalAction } from '~/lib/stores/settingsModalStore';
import { isBottomNavBarVisible } from '~/lib/stores/navigationBarStore'; // Import store for visibility
// IconButton is not used directly in NavItem as per refined plan, so import is not needed unless used elsewhere.

interface NavItemProps {
  label: string;
  icon: string;
  onClick?: () => void;
  href?: string; // For direct navigation if onClick is not primary action
  isActive?: boolean; // For future active state styling
}

const NavItem: React.FC<NavItemProps> = ({ label, icon, onClick, href, isActive }) => {
  const navigate = useNavigate(); // useNavigate can be called here as NavItem is a component

  const handleAction = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      navigate(href);
    }
  };

  return (
    <button
      onClick={handleAction}
      className={classNames(
        'flex flex-col items-center justify-center flex-1 pt-2 pb-1 text-xs min-h-[56px] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 rounded-md',
        isActive ? 'text-accent-500' : 'text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary',
        'transition-colors duration-150'
      )}
      aria-label={label}
    >
      <div className={classNames(icon, 'text-2xl mb-0.5')} />
      <span>{label}</span>
    </button>
  );
};

export const BottomNavigationBar: React.FC = () => {
  // const location = useLocation(); // For isActive state later
  // const isActive = (path: string) => location.pathname === path;

  // useNavigate hook must be called at the top level of the component that uses navigate function.
  // If NavItem handles its own navigation via href, it needs useNavigate.
  // If BottomNavigationBar handles all navigation logic for NavItems, then it needs useNavigate here.
  // The current NavItem structure calls navigate() itself if href is provided and no onClick.
  // For the "New Chat" item, an onClick handler is provided that uses navigate.

  const isVisible = useStore(isBottomNavBarVisible);
  const navigate = useNavigate();
  const newChatHandler = () => {
    // Logic for new chat might involve navigation and/or clearing state.
    // For now, just navigate to root, assuming Chat.client.tsx handles new session.
    navigate('/');
  };

  return (
    <nav className={classNames(
      "fixed bottom-0 left-0 right-0 h-[56px] bg-bolt-elements-bg-depth-1 border-t border-bolt-elements-borderColor flex justify-around items-stretch shadow-top-md md:hidden z-40",
      "transition-transform duration-300 ease-in-out", // Added transition
      isVisible ? "translate-y-0" : "translate-y-full" // Apply transform for visibility
    )}>
      {/* z-40 is used directly as per UnoCSS convention, instead of z-bottom-nav variable from plan */}
      <NavItem label="New Chat" icon="i-ph:plus-circle-duotone" onClick={newChatHandler} />
      <NavItem label="Chats" icon="i-ph:chats-teardrop-duotone" onClick={toggleSidebarStoreAction} />
      <NavItem label="Settings" icon="i-ph:gear-six-duotone" onClick={openSettingsModalAction} />
    </nav>
  );
};
