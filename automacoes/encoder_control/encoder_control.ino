// Pinos para a placa ESP8266 (NodeMCU v3 / Wemos D1 Mini)
#define CLK_PIN 14 // GPIO14 (Pino D5 na placa)
#define DT_PIN 12  // GPIO12 (Pino D6 na placa)
#define SW_PIN 13  // GPIO13 (Pino D7 na placa)

volatile bool moved = false;
volatile int direction = 0; // 1 para direita, -1 para esquerda

unsigned long lastButtonPress = 0;

// Rotina de interrupção (ISR) para o encoder
void ICACHE_RAM_ATTR isr_encoder() {
  static unsigned long lastInterruptTime = 0;
  unsigned long interruptTime = millis();
  
  // Aumentamos MUITO o debounce para 50ms para KY-040 de baixa qualidade
  // Isso limita a velocidade máxima a 20 giros por segundo (o que é ideal para menus/telas)
  if (interruptTime - lastInterruptTime > 50) {
    // Confirma mais uma vez que o pino realmente estabilizou em LOW (FALLING real)
    if (digitalRead(CLK_PIN) == LOW) {
      if (digitalRead(DT_PIN) == HIGH) {
        direction = 1; // Direita
      } else {
        direction = -1; // Esquerda
      }
      moved = true;
    }
  }
  lastInterruptTime = interruptTime;
}

void setup() {
  // Inicialização da porta serial para comunicação com a aplicação Node/Unity
  Serial.begin(115200);
  
  // Configura os pinos
  pinMode(CLK_PIN, INPUT_PULLUP);
  pinMode(DT_PIN, INPUT_PULLUP);
  // O pino SW já usa resistor Pullup interno
  pinMode(SW_PIN, INPUT_PULLUP);

  // Atrela a interrupção ao pino CLK (usar FALLING diminui oscilações no KY-040)
  attachInterrupt(digitalPinToInterrupt(CLK_PIN), isr_encoder, FALLING);
  
  Serial.println("Sistema Iniciado - Aguardando comandos do Encoder...");
}

void loop() {
  // Se o encoder se moveu (flag alterada pela interrupção)
  if (moved) {
    if (direction == 1) {
      Serial.println("RIGHT");
    } else if (direction == -1) {
      Serial.println("LEFT");
    }
    moved = false; // Reseta a flag
  }

  // Leitura do botão central do encoder (SW)
  int btnState = digitalRead(SW_PIN);
  if (btnState == LOW) { // LOW significa que foi pressionado (por conta do Pullup)
    // Anti-bounce de 300ms para o clique do botão
    if (millis() - lastButtonPress > 300) {
      Serial.println("CLICK");
      lastButtonPress = millis();
    }
  }
}
