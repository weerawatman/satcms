import { getCustomer } from "@/lib/queries/getCustomer";
import { getTicket } from "@/lib/queries/getTicket";
import { BackButton } from "@/components/BackButton";
import * as Sentry from "@sentry/nextjs";
import TicketForm from "@/app/(rs)/tickets/form/TicketForm";

import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const { customerId, ticketId } = await searchParams;

  if (!customerId && !ticketId)
    return {
      title: "Missing Ticket ID or Customer ID",
    };

  if (customerId)
    return {
      title: `New Ticket for Customer #${customerId}`,
    };

  if (ticketId)
    return {
      title: `Edit Ticket #${ticketId}`,
    };
}

export default async function TicketFormPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  try {
    const { customerId, ticketId } = await searchParams;

    if (!customerId && !ticketId) {
      return (
        <>
          <h2 className="mb-2 text-2xl">
            Ticket ID or Customer ID required to load ticket form
          </h2>
          <BackButton title="Go Back" variant="default" />
        </>
      );
    }

    const { sessionClaims } = auth();
    const publicRole =
      (sessionClaims?.publicMetadata as { role?: string } | undefined)?.role;
    const isManager =
      publicRole === "manager" || sessionClaims?.orgRole === "manager";
    const user = await currentUser();

    // New ticket form
    if (customerId) {
      const customer = await getCustomer(parseInt(customerId));

      if (!customer) {
        return (
          <>
            <h2 className="mb-2 text-2xl">
              Customer ID #{customerId} not found
            </h2>
            <BackButton title="Go Back" variant="default" />
          </>
        );
      }

      if (!customer.active) {
        return (
          <>
            <h2 className="mb-2 text-2xl">
              Customer ID #{customerId} is not active.
            </h2>
            <BackButton title="Go Back" variant="default" />
          </>
        );
      }

      // return ticket form
      if (isManager) {
        const { data: users } = await clerkClient.users.getUserList({
          limit: 100,
        });

        const techs = users
          .map((clerkUser) => clerkUser.emailAddresses[0]?.emailAddress)
          .filter((email): email is string => typeof email === "string")
          .map((email) => ({ id: email, description: email }));

        return (
          <TicketForm customer={customer} techs={techs} isManager={isManager} />
        );
      }

      return <TicketForm customer={customer} />;
    }

    // Edit ticket form
    if (ticketId) {
      const ticket = await getTicket(parseInt(ticketId));

      if (!ticket) {
        return (
          <>
            <h2 className="mb-2 text-2xl">Ticket ID #{ticketId} not found</h2>
            <BackButton title="Go Back" variant="default" />
          </>
        );
      }

      const customer = await getCustomer(ticket.customerId);

      // return ticket form
      if (isManager) {
        const { data: users } = await clerkClient.users.getUserList({
          limit: 100,
        });

        const techs = users
          .map((clerkUser) => clerkUser.emailAddresses[0]?.emailAddress)
          .filter((email): email is string => typeof email === "string")
          .map((email) => ({
            id: email.toLowerCase(),
            description: email.toLowerCase(),
          }));

        return (
          <TicketForm
            customer={customer}
            ticket={ticket}
            techs={techs}
            isManager={isManager}
          />
        );
      }

      const userEmail = user?.emailAddresses[0]?.emailAddress ?? "";
      const isEditable =
        userEmail.toLowerCase() === ticket.tech.toLowerCase();

      return (
        <TicketForm
          customer={customer}
          ticket={ticket}
          isEditable={isEditable}
        />
      );
    }
  } catch (e) {
    if (e instanceof Error) {
      Sentry.captureException(e);
      throw e;
    }
  }
}
