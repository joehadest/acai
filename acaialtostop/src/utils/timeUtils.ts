// src/utils/timeUtils.ts

/**
 * Utilitários para verificação de horários do estabelecimento
 */

export interface BusinessHours {
    open: boolean;
    start: string;
    end: string;
}

export interface BusinessHoursConfig {
    monday: BusinessHours;
    tuesday: BusinessHours;
    wednesday: BusinessHours;
    thursday: BusinessHours;
    friday: BusinessHours;
    saturday: BusinessHours;
    sunday: BusinessHours;
}

/**
 * Obtém o horário atual em formato local do Brasil
 * @returns string no formato "HH:MM"
 */
export function getCurrentTimeUTC(): string {
    const now = new Date();
    // Usar toLocaleTimeString com fuso horário específico do Brasil
    return now.toLocaleTimeString('pt-BR', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo'
    });
}

/**
 * Obtém o dia da semana atual em inglês, baseado no fuso horário de São Paulo
 * @returns string representando o dia da semana
 */
export function getCurrentDayOfWeek(): string {
    const now = new Date();
    // Usa toLocaleDateString para obter o dia da semana no fuso correto
    const dayOfWeekString = now.toLocaleDateString('en-US', {
        weekday: 'long',
        timeZone: 'America/Sao_Paulo'
    });
    return dayOfWeekString.toLowerCase();
}

/**
 * Verifica se o estabelecimento está aberto baseado nas configurações de horário
 * @param businessHours Configurações de horário do estabelecimento
 * @returns boolean indicando se está aberto
 */
export function isRestaurantOpen(businessHours: BusinessHoursConfig): boolean {
    const currentTime = getCurrentTimeUTC();
    const currentDay = getCurrentDayOfWeek();
    
    const todayHours = businessHours[currentDay as keyof BusinessHoursConfig];
    
    // VERIFICAÇÃO ADICIONADA: Garante que o dia está configurado, marcado como aberto e com horários de início e fim.
    if (!todayHours || !todayHours.open || !todayHours.start || !todayHours.end) {
        return false;
    }
    
    return currentTime >= todayHours.start && currentTime <= todayHours.end;
}

/**
 * Obtém informações detalhadas sobre o status do estabelecimento
 * @param businessHours Configurações de horário do estabelecimento
 * @returns objeto com informações detalhadas
 */
export function getRestaurantStatus(businessHours: BusinessHoursConfig) {
    const currentTime = getCurrentTimeUTC();
    const currentDay = getCurrentDayOfWeek();
    const now = new Date();
    
    const todayHours = businessHours[currentDay as keyof BusinessHoursConfig];

    // VERIFICAÇÃO ADICIONADA: Checa se os horários de início e fim estão presentes.
    const areHoursComplete = todayHours && typeof todayHours.start === 'string' && typeof todayHours.end === 'string';
    
    return {
        currentTime,
        currentDay,
        localTime: now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
        utcTime: now.toISOString(),
        todayHours,
        isOpen: todayHours?.open && areHoursComplete && currentTime >= todayHours.start && currentTime <= todayHours.end,
        reason: !todayHours ? 'Dia não configurado' : 
                !todayHours.open ? 'Dia marcado como fechado' :
                !areHoursComplete ? 'Horário incompleto' : // Motivo correto para o seu log
                currentTime < todayHours.start ? 'Ainda não abriu' :
                currentTime > todayHours.end ? 'Já fechou' : 'Aberto'
    };
}