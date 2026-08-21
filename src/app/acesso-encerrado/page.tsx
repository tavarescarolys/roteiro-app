const D = {
  bg: '#17151A', card: '#211F24', border: '#2e2b33',
  text: '#F2EFE9', muted: '#8a8490', red: '#B7022C',
}

export default function AcessoEncerradoPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: D.bg, fontFamily: 'Montserrat, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
        <img src={LOGO_SRC} alt="Do Bolso pra Tela" style={{ height: 56, objectFit: 'contain', marginBottom: 32 }} />
        <div style={{ background: D.card, borderRadius: 16, padding: 40, border: `1px solid ${D.border}` }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: D.text, marginBottom: 12 }}>Seu acesso encerrou</h1>
          <p style={{ fontSize: 14, color: D.muted, lineHeight: 1.7, marginBottom: 0 }}>
            O período de 3 meses do seu acesso ao Gerador de Roteiros chegou ao fim.<br /><br />
            Entre em contato para renovar e continuar criando seus roteiros.
          </p>
        </div>
      </div>
    </div>
  )
}
