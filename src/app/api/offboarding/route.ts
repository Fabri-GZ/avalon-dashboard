import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clientId, action } = body;

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'Missing clientId' },
        { status: 400 }
      );
    }

    const n8nUrl = 'https://gersontem.app.n8n.cloud/webhook/offboarding';

    const n8nPayload = {
      clientId,
      action: action || 'offboarding_request',
      source: 'avalon-dashboard',
      timestamp: new Date().toISOString(),
    };

    const response = await fetch(n8nUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(n8nPayload),
    });

    if (!response.ok) {
      console.error(`n8n webhook failed: ${response.status} ${response.statusText}`);
      throw new Error('n8n webhook failed');
    }

    const data = await response.json();

    const offboardingUrl = Array.isArray(data)
      ? data[0]?.offboardingUrl
      : data?.offboardingUrl;

    if (!offboardingUrl) {
      console.error('n8n response missing offboardingUrl:', data);
      throw new Error('Invalid n8n response');
    }

    return NextResponse.json(
      {
        success: true,
        offboardingUrl,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error in offboarding API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
