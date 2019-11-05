import AvailableService from '../services/AvailableService';

class AvailableController {
  async index(req, res) {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Invalid date' });
    }

    // 2019-09-18 10:49:44
    const searchDate = Number(date);

    const available = await AvailableService.run({
      provider_id: req.params.providerId,
      searchDate,
    });

    return res.json(available);
  }
}

export default new AvailableController();
