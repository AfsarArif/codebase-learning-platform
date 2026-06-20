import { NextRequest, NextResponse } from 'next/server';

/**
 * GitHub webhook receiver for push events.
 * Triggers repository re-indexing when code is pushed.
 */
export async function POST(request: NextRequest) {
  try {
    const event = request.headers.get('x-github-event');
    const signature = request.headers.get('x-hub-signature-256');

    // TODO: Verify signature with webhook secret

    if (event === 'ping') {
      return NextResponse.json({ message: 'pong' });
    }

    const body = await request.json();

    if (event === 'push') {
      const repoFullName = body.repository?.full_name;
      const commitSha = body.after;
      const branch = body.ref?.replace('refs/heads/', '');

      console.log(`Push event: ${repoFullName}@${branch} (${commitSha})`);

      // TODO: Find matching repository in DB and trigger resync
      // await resync_repository.delay(repoId, ...)

      return NextResponse.json({
        success: true,
        message: 'Webhook received, re-indexing triggered',
      });
    }

    return NextResponse.json({
      success: true,
      message: `Event type ${event} acknowledged`,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 500 },
    );
  }
}
