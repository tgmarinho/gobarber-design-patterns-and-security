import { startOfHour, isBefore, parseISO, format } from 'date-fns';
import pt from 'date-fns/locale/pt';
import User from '../models/User';
import Appointment from '../models/Appointment';
import Notification from '../schemas/Notification';
import Cache from '../../lib/Cache';

class CreateAppointmentService {
  async run({ provider_id, user_id, date }) {
    /**
     * Provider can't create appointment for itself
     */
    if (provider_id === user_id) {
      throw new Error('You can not create appointments for yourself');
    }

    /**
     * Check if provider_id is a provider
     */
    const checkIsProvider = await User.findOne({
      where: {
        id: provider_id,
        provider: true,
      },
    });

    if (!checkIsProvider) {
      throw new Error('You can only create appointments with providers');
    }

    const hourStart = startOfHour(parseISO(date));

    /**
     * Check for past dates
     */
    if (isBefore(hourStart, new Date())) {
      throw new Error('Past date are not permitted');
    }

    /**
     * Check date availabity
     */
    const checkAvailabitity = await Appointment.findOne({
      where: {
        provider_id,
        canceled_at: null,
        date: hourStart,
      },
    });

    if (checkAvailabitity) {
      throw new Error('Appointment date is not available');
    }

    const appointment = await Appointment.create({
      user_id,
      provider_id,
      date,
    });

    /**
     * Notify appointment provider
     */
    const user = await User.findByPk(user_id);
    const formattedDate = format(
      hourStart,
      "'dia' dd 'de' MMMM', às' H:mm'h'",
      {
        locale: pt,
      }
    );
    await Notification.create({
      content: `Novo agendamento de ${user.name} para o ${formattedDate}`,
      user: provider_id,
    });

    /* Invalidade cache */
    await Cache.invalidatePrefix(`user:${user_id}:appointments`);

    return appointment;
  }
}

export default new CreateAppointmentService();
