import { useStore } from '@nanostores/react';
import { ClientOnly } from 'remix-utils/client-only';
import { chatStore } from '~/lib/stores/chat';
import { classNames } from '~/utils/classNames';
import { HeaderActionButtons } from './HeaderActionButtons.client';
import { ChatDescription } from '~/lib/persistence/ChatDescription.client';
import { toggleSidebar } from '~/lib/stores/sidebarStore';
import { IconButton } from '~/components/ui/IconButton'; // Assuming IconButton can be used or a simple button

export function Header() {
  const chat = useStore(chatStore);

  return (
    <header
      className={classNames(
        'flex items-center p-3 sm:p-4 md:p-5 border-b h-[var(--header-height)]', // Responsive padding
        {
          'border-transparent': !chat.started,
          'border-bolt-elements-borderColor': chat.started,
        },
      )}
    >
      <div className="flex items-center gap-2 z-logo text-bolt-elements-textPrimary">
        {/* Sidebar Toggle Button - visible only on smaller screens */}
        <ClientOnly>
          {() => (
            <IconButton
              onClick={() => toggleSidebar()}
              className="md:hidden text-bolt-elements-textPrimary hover:text-bolt-elements-textPrimary" // Show only on <md screens
              title="Toggle Sidebar"
              size="xl" // Ensure it's easily tappable
            >
              <div className="i-ph:sidebar-simple-duotone text-xl" />
            </IconButton>
          )}
        </ClientOnly>
        <a href="/" className="text-2xl font-semibold text-accent flex items-center">
          {/* <span className="i-bolt:logo-text?mask w-[46px] inline-block" /> */}
          {/* Consider making logo size responsive if needed: e.g., w-[70px] sm:w-[90px] */}
          <img src="/logo-light-styled.png" alt="logo" className="w-[90px] inline-block dark:hidden" />
          <img src="/logo-dark-styled.png" alt="logo" className="w-[90px] inline-block hidden dark:block" />
        </a>
      </div>
      {chat.started && ( // Display ChatDescription and HeaderActionButtons only when the chat has started.
        <>
          <span className="flex-1 px-2 sm:px-4 truncate text-center text-bolt-elements-textPrimary">
            <ClientOnly>{() => <ChatDescription />}</ClientOnly>
          </span>
          <ClientOnly>
            {() => (
              <div className="me-1"> {/* Changed mr-1 to me-1 */}
                <HeaderActionButtons />
              </div>
            )}
          </ClientOnly>
        </>
      )}
    </header>
  );
}
