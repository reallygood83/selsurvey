import { NextRequest, NextResponse } from 'next/server';

// 이메일 전송 API (실제 구현 시 SendGrid, AWS SES 등 사용)
export async function POST(request: NextRequest) {
  try {
    const { parentEmail, studentName, reportData, reportHTML } = await request.json();

    console.log('📧 이메일 전송 요청:', {
      parentEmail,
      studentName,
      hasReportData: !!reportData,
      htmlLength: reportHTML?.length || 0
    });

    // 이메일 유효성 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(parentEmail)) {
      return NextResponse.json(
        { error: '유효하지 않은 이메일 주소입니다.' },
        { status: 400 }
      );
    }

    // 이메일 내용 구성
    const emailSubject = `${studentName} 학생 SEL 상담 리포트`;
    const emailBody = `
안녕하세요,

${studentName} 학생의 사회정서학습(SEL) 상담 리포트를 보내드립니다.

■ 리포트 생성일: ${reportData.generatedAt || new Date().toLocaleDateString('ko-KR')}
■ 분석 방법: AI 기반 종합 분석
${reportData.dataQuality ? `■ 분석 신뢰도: ${reportData.dataQuality.confidenceLevel}` : ''}

첨부된 상세 리포트를 확인해 주시고, 궁금한 점이 있으시면 언제든 담임선생님께 연락해 주세요.

감사합니다.

---
SEL 교육 플랫폼
자동 발송 메일입니다.
    `;

    // 실제 이메일 전송 로직 (예시)
    // 여기서는 시뮬레이션으로 처리
    await simulateEmailSending({
      to: parentEmail,
      subject: emailSubject,
      textBody: emailBody,
      htmlBody: reportHTML,
      studentName
    });

    console.log('✅ 이메일 전송 시뮬레이션 완료');

    return NextResponse.json({
      success: true,
      message: '이메일이 성공적으로 전송되었습니다.',
      sentAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ 이메일 전송 오류:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : '이메일 전송 중 오류가 발생했습니다.'
      },
      { status: 500 }
    );
  }
}

// 이메일 전송 시뮬레이션 함수
async function simulateEmailSending({
  to,
  subject,
  textBody,
  htmlBody,
  studentName
}: {
  to: string;
  subject: string;
  textBody: string;
  htmlBody: string;
  studentName: string;
}) {
  // 실제 구현 시에는 여기에 SendGrid, AWS SES, 또는 다른 이메일 서비스 코드를 작성
  console.log('📧 이메일 전송 세부사항:', {
    recipient: to,
    subject,
    bodyLength: textBody.length,
    htmlLength: htmlBody.length,
    timestamp: new Date().toISOString()
  });

  // 실제 전송 시뮬레이션 (2초 대기)
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 성공적으로 전송되었다고 가정
  return {
    messageId: `msg_${Date.now()}_${studentName}`,
    status: 'sent',
    timestamp: new Date().toISOString()
  };
}

/* 
실제 SendGrid 구현 예시:

import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const msg = {
  to: parentEmail,
  from: 'noreply@school.edu',
  subject: emailSubject,
  text: emailBody,
  html: reportHTML,
  attachments: [
    {
      content: Buffer.from(reportHTML).toString('base64'),
      filename: `${studentName}_SEL리포트_${new Date().toISOString().split('T')[0]}.html`,
      type: 'text/html',
      disposition: 'attachment'
    }
  ]
};

await sgMail.send(msg);
*/